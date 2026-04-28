import { describe, expect, it } from "vitest";
import type { Edge, Node } from "reactflow";
import { applySceneGraphFilters } from "./graphFilters";
import type {
  SceneGraphData,
  SceneGraphIssueSummary,
  SceneGraphNodeData,
} from "./graphData.types";

function makeNode(
  id: string,
  routeId: string,
  overrides: Partial<SceneGraphNodeData> = {},
): Node<SceneGraphNodeData> {
  return {
    id,
    position: { x: 0, y: 0 },
    data: {
      label: id,
      routeId,
      isStartScene: false,
      isEndingScene: false,
      ...overrides,
    },
  };
}

function makeEdge(id: string, source: string, target: string): Edge {
  return { id, source, target, label: "" };
}

function makeIssueSummary(sceneId: string): SceneGraphIssueSummary {
  return {
    sceneId,
    sceneTitle: sceneId,
    categories: ["空场景"],
    issues: ["test"],
  };
}

describe("applySceneGraphFilters", () => {
  it("routeFilter='all' 不动节点和边", () => {
    const graph: SceneGraphData = {
      nodes: [makeNode("a", "ra"), makeNode("b", "rb")],
      edges: [makeEdge("e1", "a", "b")],
      conditionSummaries: [],
      issueSummaries: [],
    };

    const result = applySceneGraphFilters(graph, {
      routeFilter: "all",
      routeId: null,
      questionOnly: false,
    });

    expect(result.nodes.map((node) => node.id)).toEqual(["a", "b"]);
    expect(result.edges.map((edge) => edge.id)).toEqual(["e1"]);
  });

  it("routeFilter='single' 只保留指定路线的节点", () => {
    const graph: SceneGraphData = {
      nodes: [makeNode("a", "ra"), makeNode("b", "rb"), makeNode("c", "ra")],
      edges: [
        makeEdge("e_a_b", "a", "b"),
        makeEdge("e_a_c", "a", "c"),
        makeEdge("e_c_b", "c", "b"),
      ],
      conditionSummaries: [],
      issueSummaries: [],
    };

    const result = applySceneGraphFilters(graph, {
      routeFilter: "single",
      routeId: "ra",
      questionOnly: false,
    });

    expect(result.nodes.map((node) => node.id).sort()).toEqual(["a", "c"]);
    // 只保留两端都在可见集中的边
    expect(result.edges.map((edge) => edge.id)).toEqual(["e_a_c"]);
  });

  it("routeFilter='single' 时跨路线条件摘要被剪掉（看 sceneId 与 linkId 都得在）", () => {
    const graph: SceneGraphData = {
      nodes: [makeNode("a", "ra"), makeNode("b", "rb")],
      edges: [makeEdge("e_inside", "a", "a"), makeEdge("e_cross", "a", "b")],
      conditionSummaries: [
        {
          sceneId: "a",
          sceneTitle: "A",
          linkId: "e_inside",
          linkLabel: "",
          summary: "S1",
        },
        {
          sceneId: "a",
          sceneTitle: "A",
          linkId: "e_cross",
          linkLabel: "",
          summary: "S2",
        },
      ],
      issueSummaries: [],
    };

    const result = applySceneGraphFilters(graph, {
      routeFilter: "single",
      routeId: "ra",
      questionOnly: false,
    });

    // e_cross 端点 b 不在可见集 → 被移除；它的 conditionSummary 也跟着被剪
    expect(result.conditionSummaries.map((summary) => summary.linkId)).toEqual([
      "e_inside",
    ]);
  });

  it("questionOnly=true 时只保留 issueSummaries 中的场景", () => {
    const graph: SceneGraphData = {
      nodes: [makeNode("a", "ra"), makeNode("b", "ra"), makeNode("c", "ra")],
      edges: [makeEdge("e_a_b", "a", "b"), makeEdge("e_b_c", "b", "c")],
      conditionSummaries: [],
      issueSummaries: [makeIssueSummary("a"), makeIssueSummary("c")],
    };

    const result = applySceneGraphFilters(graph, {
      routeFilter: "all",
      routeId: null,
      questionOnly: true,
    });

    expect(result.nodes.map((node) => node.id).sort()).toEqual(["a", "c"]);
    // a 与 c 之间没直接边，所以剩下 0 条 edge
    expect(result.edges).toEqual([]);
    expect(
      result.issueSummaries.map((summary) => summary.sceneId).sort(),
    ).toEqual(["a", "c"]);
  });

  it("routeFilter='single' + questionOnly 双重过滤都生效", () => {
    const graph: SceneGraphData = {
      nodes: [
        makeNode("a", "ra"), // 在 ra 且有问题
        makeNode("b", "rb"), // 在 rb 也有问题，但路线被过滤
        makeNode("c", "ra"), // 在 ra 但没问题
      ],
      edges: [],
      conditionSummaries: [],
      issueSummaries: [makeIssueSummary("a"), makeIssueSummary("b")],
    };

    const result = applySceneGraphFilters(graph, {
      routeFilter: "single",
      routeId: "ra",
      questionOnly: true,
    });

    // b 被路线过滤剪掉；c 被 questionOnly 剪掉；只剩 a
    expect(result.nodes.map((node) => node.id)).toEqual(["a"]);
    expect(result.issueSummaries.map((summary) => summary.sceneId)).toEqual([
      "a",
    ]);
  });

  it("空图安全返回空图", () => {
    const result = applySceneGraphFilters(
      { nodes: [], edges: [], conditionSummaries: [], issueSummaries: [] },
      { routeFilter: "single", routeId: "any", questionOnly: true },
    );
    expect(result).toEqual({
      nodes: [],
      edges: [],
      conditionSummaries: [],
      issueSummaries: [],
    });
  });
});
