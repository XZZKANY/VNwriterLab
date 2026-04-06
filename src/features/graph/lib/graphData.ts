import type { SceneBlock } from "../../../lib/domain/block";
import type { Scene } from "../../../lib/domain/scene";
import type { ProjectVariable } from "../../../lib/domain/variable";
import { parseChoiceBlockMeta } from "../../editor/store/choiceBlock";
import { parseConditionBlockMeta } from "../../editor/store/conditionBlock";
import type { SceneLink } from "../../editor/store/linkUtils";
import type { Edge, Node } from "reactflow";

export interface SceneGraphConditionSummary {
  sceneId: string;
  sceneTitle: string;
  linkId: string;
  linkLabel: string;
  summary: string;
}

export interface SceneGraphIssueSummary {
  sceneId: string;
  sceneTitle: string;
  issues: string[];
}

export interface SceneGraphNodeData {
  label: string;
  routeId: string;
  isStartScene: boolean;
  isEndingScene: boolean;
}

export interface SceneGraphViewFilters {
  routeFilter: "all" | "single";
  routeId: string | null;
  questionOnly: boolean;
}

export interface SceneGraphData {
  nodes: Node<SceneGraphNodeData>[];
  edges: Edge[];
  conditionSummaries: SceneGraphConditionSummary[];
  issueSummaries: SceneGraphIssueSummary[];
}

function buildVariableMap(variables: ProjectVariable[]) {
  return new Map(variables.map((variable) => [variable.id, variable]));
}

function buildSceneMap(scenes: Scene[]) {
  return new Map(scenes.map((scene) => [scene.id, scene]));
}

function buildVisibleGraphIndex(graph: SceneGraphData) {
  const incomingCountByNodeId = new Map<string, number>();
  const outgoingCountByNodeId = new Map<string, number>();

  graph.nodes.forEach((node) => {
    incomingCountByNodeId.set(node.id, 0);
    outgoingCountByNodeId.set(node.id, 0);
  });

  graph.edges.forEach((edge) => {
    outgoingCountByNodeId.set(
      edge.source,
      (outgoingCountByNodeId.get(edge.source) ?? 0) + 1,
    );
    incomingCountByNodeId.set(
      edge.target,
      (incomingCountByNodeId.get(edge.target) ?? 0) + 1,
    );
  });

  return {
    incomingCountByNodeId,
    outgoingCountByNodeId,
  };
}

function isQuestionScene(
  node: Node<SceneGraphNodeData>,
  incomingCountByNodeId: Map<string, number>,
  outgoingCountByNodeId: Map<string, number>,
) {
  const incomingCount = incomingCountByNodeId.get(node.id) ?? 0;
  const outgoingCount = outgoingCountByNodeId.get(node.id) ?? 0;

  return (
    (!node.data.isEndingScene && outgoingCount === 0) ||
    (incomingCount === 0 && !node.data.isStartScene)
  );
}

function collectSceneIssues(
  scene: Scene,
  sceneById: Map<string, Scene>,
  variablesById: Map<string, ProjectVariable>,
  incomingCount: number,
  outgoingCount: number,
) {
  const issues: string[] = [];

  if (!scene.isEndingScene && outgoingCount === 0) {
    issues.push("非结局场景且没有任何出边");
  }

  if (!scene.isStartScene && incomingCount === 0) {
    issues.push("没有任何入边且不是起始场景");
  }

  const sortedBlocks = [...scene.blocks].sort(
    (left, right) => left.sortOrder - right.sortOrder,
  );

  sortedBlocks.forEach((block) => {
    if (block.blockType === "condition") {
      const condition = parseConditionBlockMeta(block.metaJson);
      condition.conditions.forEach((item) => {
        if (!item.variableId) {
          issues.push("条件块未选择变量");
          return;
        }

        if (!variablesById.has(item.variableId)) {
          issues.push("条件块引用了已删除变量");
        }
      });
      return;
    }

    if (block.blockType !== "choice") {
      return;
    }

    const choice = parseChoiceBlockMeta(block.metaJson);
    if (choice.targetSceneId && !sceneById.has(choice.targetSceneId)) {
      issues.push("选项块跳转到不存在的场景");
    }

    if (choice.effectVariableId && !variablesById.has(choice.effectVariableId)) {
      issues.push("选项块副作用引用了已删除变量");
    }
  });

  return issues;
}

function formatConditionSummary(
  block: SceneBlock,
  variablesById: Map<string, ProjectVariable>,
) {
  const condition = parseConditionBlockMeta(block.metaJson);
  if (condition.conditions.length === 0) {
    return "无条件";
  }

  return condition.conditions
    .map((item) => {
      const variable = item.variableId
        ? variablesById.get(item.variableId) ?? null
        : null;
      const variableName = variable?.name ?? (item.variableId ? "已删除变量" : "未选择变量");

      if (item.operator === "gte") {
        return `${variableName} ≥ ${item.compareValue}`;
      }

      return `${variableName} 为真`;
    })
    .join("且");
}

function collectConditionBlocks(scene: Scene, sourceBlockId: string | null) {
  if (!sourceBlockId) {
    return [];
  }

  const sortedBlocks = [...scene.blocks].sort(
    (left, right) => left.sortOrder - right.sortOrder,
  );
  const sourceBlockIndex = sortedBlocks.findIndex(
    (block) => block.id === sourceBlockId,
  );

  if (sourceBlockIndex <= 0) {
    return [];
  }

  const conditionBlocks: SceneBlock[] = [];
  for (let index = sourceBlockIndex - 1; index >= 0; index -= 1) {
    const currentBlock = sortedBlocks[index];
    if (currentBlock?.blockType !== "condition") {
      break;
    }

    conditionBlocks.unshift(currentBlock);
  }

  return conditionBlocks;
}

export function buildSceneGraph(
  scenes: Scene[],
  links: SceneLink[],
  variables: ProjectVariable[] = [],
): SceneGraphData {
  const variablesById = buildVariableMap(variables);
  const sceneById = buildSceneMap(scenes);
  const orderedScenes = [...scenes].sort((left, right) => {
    if (left.sortOrder === right.sortOrder) {
      return left.title.localeCompare(right.title, "zh-CN");
    }

    return left.sortOrder - right.sortOrder;
  });

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
        );

        if (issues.length === 0) {
          return null;
        }

        return {
          sceneId: scene.id,
          sceneTitle: scene.title,
          issues,
        };
      })
      .filter(
        (summary): summary is SceneGraphIssueSummary => summary !== null,
      ),
  };
}

export function applySceneGraphFilters(
  graph: SceneGraphData,
  filters: SceneGraphViewFilters,
): SceneGraphData {
  const visibleSceneIds = new Set(
    graph.nodes
      .filter((node) =>
        filters.routeFilter === "all" || node.data.routeId === filters.routeId,
      )
      .map((node) => node.id),
  );
  const routeFilteredEdges = graph.edges.filter(
    (edge) =>
      visibleSceneIds.has(edge.source) && visibleSceneIds.has(edge.target),
  );
  const routeFilteredEdgeIds = new Set(
    routeFilteredEdges.map((edge) => edge.id),
  );
  const routeFilteredGraph: SceneGraphData = {
    nodes: graph.nodes.filter((node) => visibleSceneIds.has(node.id)),
    edges: routeFilteredEdges,
    conditionSummaries: graph.conditionSummaries.filter(
      (summary) =>
        visibleSceneIds.has(summary.sceneId) &&
        routeFilteredEdgeIds.has(summary.linkId),
    ),
    issueSummaries: graph.issueSummaries.filter((summary) =>
      visibleSceneIds.has(summary.sceneId),
    ),
  };

  if (!filters.questionOnly) {
    return routeFilteredGraph;
  }

  const { incomingCountByNodeId, outgoingCountByNodeId } =
    buildVisibleGraphIndex(routeFilteredGraph);
  const questionSceneIds = new Set(
    routeFilteredGraph.nodes
      .filter((node) =>
        isQuestionScene(node, incomingCountByNodeId, outgoingCountByNodeId),
      )
      .map((node) => node.id),
  );
  const questionEdges = routeFilteredGraph.edges.filter(
    (edge) =>
      questionSceneIds.has(edge.source) && questionSceneIds.has(edge.target),
  );
  const questionEdgeIds = new Set(questionEdges.map((edge) => edge.id));

  return {
    nodes: routeFilteredGraph.nodes.filter((node) =>
      questionSceneIds.has(node.id),
    ),
    edges: questionEdges,
    conditionSummaries: routeFilteredGraph.conditionSummaries.filter(
      (summary) =>
        questionSceneIds.has(summary.sceneId) &&
        questionEdgeIds.has(summary.linkId),
    ),
    issueSummaries: routeFilteredGraph.issueSummaries.filter((summary) =>
      questionSceneIds.has(summary.sceneId),
    ),
  };
}
