import { clearChoiceBlockTargetSceneId } from "@/features/editor/store/choiceBlock";
import { useEditorStore } from "@/features/editor/store/useEditorStore";
import type { Project } from "@/lib/domain/project";
import type { Scene } from "@/lib/domain/scene";
import type { ProjectVariable } from "@/lib/domain/variable";
import type { SceneLink } from "@/features/editor/store/linkUtils";
import { syncEditorScenesFromProjectScenes } from "./projectSceneUtils";

/**
 * 项目 store ↔ editor store 的桥接层。
 *
 * 历史背景：项目相关的动作（创建、删除场景、移动场景、更换路线、加载项目）会同时
 * 更改两个 store 的状态。早期实现把 `useEditorStore.setState(...)` 直接散落在 4 个
 * project slice 文件里。本文件把所有"项目动作 → editor 副作用"集中起来，让 slice
 * 文件不再 import editor store——以此降低双向耦合并方便单点维护。
 *
 * 行为完全等价于原内联代码，没有变更场景同步逻辑。
 */

/**
 * 加载项目时把 editor store 的场景/链接/变量与新项目对齐。
 * 保留与新项目场景仍存在交集的部分，丢弃其余。
 */
export function syncEditorOnProjectHydrate(project: Project) {
  const currentEditorState = useEditorStore.getState();
  const syncedScenes =
    currentEditorState.scenes.length > 0
      ? syncEditorScenesFromProjectScenes(
          project.routes,
          project.scenes,
          currentEditorState.scenes,
        )
      : project.scenes;
  const nextScenes = syncedScenes.length > 0 ? syncedScenes : project.scenes;
  const nextSceneIds = new Set(nextScenes.map((scene) => scene.id));

  useEditorStore.setState({
    scenes: nextScenes,
    selectedSceneId:
      currentEditorState.selectedSceneId &&
      nextSceneIds.has(currentEditorState.selectedSceneId)
        ? currentEditorState.selectedSceneId
        : (nextScenes[0]?.id ?? null),
    links: currentEditorState.links.filter(
      (link) =>
        nextSceneIds.has(link.fromSceneId) && nextSceneIds.has(link.toSceneId),
    ),
    variables: currentEditorState.variables.filter(
      (variable) => variable.projectId === project.id,
    ),
    selectedVariableId:
      currentEditorState.selectedVariableId &&
      currentEditorState.variables.some(
        (variable) =>
          variable.id === currentEditorState.selectedVariableId &&
          variable.projectId === project.id,
      )
        ? currentEditorState.selectedVariableId
        : null,
  });
}

/**
 * 创建新项目时把 editor store 重置为该项目的初始场景。
 * 不保留之前的链接、变量等，全部归零。
 */
export function replaceEditorOnProjectCreate(project: Project) {
  useEditorStore.setState({
    scenes: project.scenes,
    selectedSceneId: project.scenes[0]?.id ?? null,
    links: [],
    variables: [],
    selectedVariableId: null,
  });
}

/**
 * 导入项目时把 editor store 完整替换为载入的场景/链接/变量。
 * 与 replaceEditorOnProjectCreate 不同的是这里携带了完整的 links / variables。
 */
export function replaceEditorOnProjectImport(input: {
  scenes: Scene[];
  links: SceneLink[];
  variables: ProjectVariable[];
}) {
  useEditorStore.setState({
    scenes: input.scenes,
    selectedSceneId: input.scenes[0]?.id ?? null,
    links: input.links,
    variables: input.variables,
    selectedVariableId: input.variables[0]?.id ?? null,
  });
}

/**
 * 上下移、跨路线移动等"重新归位"操作后，把项目侧最新场景同步到 editor store。
 * 仅同步 `scenes`，不动 selectedSceneId / links / variables。
 */
export function syncEditorAfterSceneRearrangement(
  routes: Project["routes"],
  normalizedScenes: Scene[],
) {
  useEditorStore.setState((state) => ({
    scenes: syncEditorScenesFromProjectScenes(
      routes,
      normalizedScenes,
      state.scenes,
    ),
  }));
}

/**
 * 单条场景更新（标题/摘要/状态/起止）后，同步 editor 中的 scenes，
 * 同时把已经不存在的 selectedSceneId 重定位到列表首项或 null。
 */
export function syncEditorAfterSceneUpdate(
  routes: Project["routes"],
  nextScenes: Scene[],
) {
  useEditorStore.setState((state) => ({
    scenes: syncEditorScenesFromProjectScenes(routes, nextScenes, state.scenes),
    selectedSceneId:
      state.selectedSceneId &&
      !nextScenes.some((scene) => scene.id === state.selectedSceneId)
        ? (nextScenes[0]?.id ?? null)
        : state.selectedSceneId,
  }));
}

/**
 * 删除场景后清理 editor store：
 * - 同步 `scenes` 并清掉所有指向已删除场景的 choice 块的 targetSceneId
 * - 删除关联的 links
 * - 用预先计算好的 `nextSelectedSceneId` 替换原 selectedSceneId
 *
 * 调用方需要先计算 `nextSelectedSceneId`，因为它依赖删除前的索引位置。
 */
export function syncEditorAfterSceneDelete(input: {
  routes: Project["routes"];
  normalizedScenes: Scene[];
  deletedSceneId: string;
  nextSelectedSceneId: string | null;
}) {
  const { routes, normalizedScenes, deletedSceneId, nextSelectedSceneId } =
    input;
  const currentEditorState = useEditorStore.getState();

  useEditorStore.setState({
    scenes: syncEditorScenesFromProjectScenes(
      routes,
      normalizedScenes,
      currentEditorState.scenes,
    ).map((scene) => ({
      ...scene,
      blocks: scene.blocks.map((block) => {
        if (block.blockType !== "choice") {
          return block;
        }

        const nextMetaJson = clearChoiceBlockTargetSceneId(
          block.metaJson,
          deletedSceneId,
        );
        if (nextMetaJson === block.metaJson) {
          return block;
        }

        return {
          ...block,
          metaJson: nextMetaJson,
        };
      }),
    })),
    links: currentEditorState.links.filter(
      (link) =>
        link.fromSceneId !== deletedSceneId &&
        link.toSceneId !== deletedSceneId,
    ),
    selectedSceneId: nextSelectedSceneId,
  });
}

/**
 * 删除场景前需要先读 editor store 的 selectedSceneId，再决定下一步选中哪个场景。
 * 这一步不写 store，只是个读取助手——为了让 slice 不直接 import useEditorStore。
 */
export function readEditorSelectedSceneId(): string | null {
  return useEditorStore.getState().selectedSceneId;
}
