import type { Route } from "@/lib/domain/project";
import type { Scene } from "@/lib/domain/scene";
import type { ProjectVariable } from "@/lib/domain/variable";
import type { SceneLink } from "@/features/editor/store/linkUtils";
import {
  collectConditionBlocks,
  formatConditionSummary,
} from "./graphConditionSummary";
import type {
  SceneGraphData,
  SceneGraphIssueSummary,
  SceneGraphNodeData,
} from "./graphData.types";
import {
  collectSceneIssues,
  collectUnresolvedForeshadowMessagesByScene,
} from "./graphIssueDetector";

const STATUS_LABELS: Record<
  NonNullable<SceneGraphNodeData["status"]>,
  string
> = {
  draft: "草稿",
  completed: "已完成",
  needs_revision: "需修改",
  needs_supplement: "待补充",
  needs_logic_check: "待检查逻辑",
};

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
  routes: Route[] = [],
): SceneGraphData {
  const variablesById = buildVariableMap(variables);
  const sceneById = buildSceneMap(scenes);
  const routesById = new Map(routes.map((route) => [route.id, route]));
  const unresolvedForeshadowMessagesByScene =
    collectUnresolvedForeshadowMessagesByScene(scenes);
  const orderedScenes = sortScenesForLayout(scenes);

  // 按 routeId 分组后做"列布局"：每条路线占一列，列内按场景顺序排版。
  // routes 为空时降级到旧的 3 列网格。
  const routeOrderIndex = new Map(
    routes
      .slice()
      .sort((left, right) => {
        if (left.sortOrder !== right.sortOrder) {
          return left.sortOrder - right.sortOrder;
        }
        return left.id.localeCompare(right.id);
      })
      .map((route, index) => [route.id, index] as const),
  );
  const rowByRoute = new Map<string, number>();

  function computePosition(scene: Scene, index: number) {
    if (routes.length === 0) {
      return {
        x: (index % 3) * 320,
        y: Math.floor(index / 3) * 220,
      };
    }
    const column = routeOrderIndex.get(scene.routeId) ?? routeOrderIndex.size;
    const row = rowByRoute.get(scene.routeId) ?? 0;
    rowByRoute.set(scene.routeId, row + 1);
    return { x: column * 340, y: row * 180 };
  }

  return {
    nodes: orderedScenes.map((scene, index) => {
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

      return {
        id: scene.id,
        type: "scene",
        position: computePosition(scene, index),
        data: {
          label: scene.title,
          routeId: scene.routeId,
          isStartScene: scene.isStartScene,
          isEndingScene: scene.isEndingScene,
          routeName: routesById.get(scene.routeId)?.name,
          sceneType: scene.sceneType,
          status: scene.status,
          statusLabel: STATUS_LABELS[scene.status],
          hasIssue: issues.length > 0,
          blockCount: scene.blocks.length,
          incomingCount,
          outgoingCount,
        } satisfies SceneGraphNodeData,
        draggable: true,
        selectable: true,
      };
    }),
    edges: links.map((link) => ({
      id: link.id,
      source: link.fromSceneId,
      target: link.toSceneId,
      label: link.label,
      animated: link.linkType === "choice",
      type: "default",
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
