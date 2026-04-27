import type { SceneGraphData, SceneGraphViewFilters } from "./graphData.types";

/**
 * 对已构建好的图按"路线 / 仅显示问题节点"两种条件过滤。
 * 所有命中的节点、连边、条件摘要、问题摘要都会一并裁剪，保持互相一致。
 */
export function applySceneGraphFilters(
  graph: SceneGraphData,
  filters: SceneGraphViewFilters,
): SceneGraphData {
  const visibleSceneIds = new Set(
    graph.nodes
      .filter(
        (node) =>
          filters.routeFilter === "all" ||
          node.data.routeId === filters.routeId,
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

  const questionSceneIds = new Set(
    routeFilteredGraph.issueSummaries.map((summary) => summary.sceneId),
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
