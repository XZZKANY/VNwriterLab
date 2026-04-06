import { describe, expect, it } from "vitest";
import { applySceneGraphFilters, buildSceneGraph } from "./graphData";

describe("graph issue categories", () => {
  it("会把空场景标记为空场景分类，并在只看问题节点时保留", () => {
    const graph = buildSceneGraph(
      [
        {
          id: "s1",
          projectId: "p1",
          routeId: "r1",
          title: "空白场景",
          summary: "",
          sceneType: "normal",
          status: "draft",
          chapterLabel: "",
          sortOrder: 0,
          isStartScene: true,
          isEndingScene: false,
          notes: "",
          blocks: [],
        },
        {
          id: "s2",
          projectId: "p1",
          routeId: "r1",
          title: "后续场景",
          summary: "",
          sceneType: "ending",
          status: "draft",
          chapterLabel: "",
          sortOrder: 1,
          isStartScene: false,
          isEndingScene: true,
          notes: "",
          blocks: [
            {
              id: "b1",
              sceneId: "s2",
              blockType: "narration",
              sortOrder: 0,
              characterId: null,
              contentText: "有效内容",
              metaJson: null,
            },
          ],
        },
      ],
      [
        {
          id: "l1",
          projectId: "p1",
          fromSceneId: "s1",
          toSceneId: "s2",
          linkType: "choice",
          sourceBlockId: null,
          label: "前往后续场景",
          conditionId: null,
          priorityOrder: 0,
        },
      ],
      [],
    );

    expect(graph.issueSummaries).toEqual([
      expect.objectContaining({
        sceneId: "s1",
        categories: expect.arrayContaining(["空场景"]),
        issues: expect.arrayContaining(["当前场景还没有任何内容块"]),
      }),
    ]);

    const filtered = applySceneGraphFilters(graph, {
      routeFilter: "all",
      routeId: null,
      questionOnly: true,
    });

    expect(filtered.nodes.map((node) => node.id)).toEqual(["s1"]);
    expect(filtered.issueSummaries).toEqual([
      expect.objectContaining({
        sceneId: "s1",
        categories: expect.arrayContaining(["空场景"]),
      }),
    ]);
  });
});
