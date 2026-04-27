import type { Scene } from "@/lib/domain/scene";
import type { ProjectVariable } from "@/lib/domain/variable";
import type { SceneLink } from "@/features/editor/store/linkUtils";
import {
  collectConditionBlocks,
  formatConditionSummary,
} from "./graphConditionSummary";
import type { SceneGraphData, SceneGraphIssueSummary } from "./graphData.types";
import {
  collectSceneIssues,
  collectUnresolvedForeshadowMessagesByScene,
} from "./graphIssueDetector";

export type {
  SceneGraphConditionSummary,
  SceneGraphData,
  SceneGraphIssue,
  SceneGraphIssueCode,
  SceneGraphIssueSummary,
  SceneGraphNodeData,
  SceneGraphViewFilters,
} from "./graphData.types";
export { applySceneGraphFilters } from "./graphFilters";

function buildVariableMap(variables: ProjectVariable[]) {
  return new Map(variables.map((variable) => [variable.id, variable]));
}

function buildSceneMap(scenes: Scene[]) {
  return new Map(scenes.map((scene) => [scene.id, scene]));
}

function sortScenesForLayout(scenes: Scene[]) {
  return [...scenes].sort((left, right) => {
    if (left.sortOrder === right.sortOrder) {
      return left.title.localeCompare(right.title, "zh-CN");
    }

    return left.sortOrder - right.sortOrder;
  });
}

/**
 * 把场景、连线、变量数据组装成一张完整的分支图：
 * 节点 / 连边 / 条件摘要 / 问题摘要 在同一次遍历中对齐。
 *
 * 子模块拆分：
 * - 节点位置和边以纯映射方式产出，不外抽。
 * - 条件摘要 → `graphConditionSummary.ts`
 * - 问题摘要 → `graphIssueDetector.ts`
 * - 视图过滤 → `graphFilters.ts`（通过 `applySceneGraphFilters` 重新导出）
 */
export function buildSceneGraph(
  scenes: Scene[],
  links: SceneLink[],
  variables: ProjectVariable[] = [],
): SceneGraphData {
  const variablesById = buildVariableMap(variables);
  const sceneById = buildSceneMap(scenes);
  const unresolvedForeshadowMessagesByScene =
    collectUnresolvedForeshadowMessagesByScene(scenes);
  const orderedScenes = sortScenesForLayout(scenes);

  return {
    nodes: orderedScenes.map((scene, index) => ({
      id: scene.id,
      position: {
        x: (index % 3) * 280,
        y: Math.floor(index / 3) * 180,
      },
      data: {
        label: scene.title,
        routeId: scene.routeId,
        isStartScene: scene.isStartScene,
        isEndingScene: scene.isEndingScene,
      },
      draggable: false,
      selectable: false,
    })),
    edges: links.map((link) => ({
      id: link.id,
      source: link.fromSceneId,
      target: link.toSceneId,
      label: link.label,
      animated: link.linkType === "choice",
    })),
    conditionSummaries: links.flatMap((link) => {
      const scene = scenes.find((item) => item.id === link.fromSceneId);
      if (!scene) {
        return [];
      }

      const conditionBlocks = collectConditionBlocks(scene, link.sourceBlockId);
      if (conditionBlocks.length === 0) {
        return [];
      }

      return [
        {
          sceneId: scene.id,
          sceneTitle: scene.title,
          linkId: link.id,
          linkLabel: link.label || "未命名连线",
          summary: conditionBlocks
            .map((block) => formatConditionSummary(block, variablesById))
            .join("；"),
        },
      ];
    }),
    issueSummaries: orderedScenes
      .map((scene) => {
        const incomingCount = links.filter(
          (link) => link.toSceneId === scene.id,
        ).length;
        const outgoingCount = links.filter(
          (link) => link.fromSceneId === scene.id,
        ).length;
        const issues = collectSceneIssues(
          scene,
          sceneById,
          variablesById,
          incomingCount,
          outgoingCount,
          unresolvedForeshadowMessagesByScene.get(scene.id) ?? [],
        );

        if (issues.length === 0) {
          return null;
        }

        return {
          sceneId: scene.id,
          sceneTitle: scene.title,
          categories: [...new Set(issues.map((issue) => issue.category))],
          issues: issues.map((issue) => issue.message),
        };
      })
      .filter((summary): summary is SceneGraphIssueSummary => summary !== null),
  };
}
