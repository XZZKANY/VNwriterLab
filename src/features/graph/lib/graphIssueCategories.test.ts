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

  it("会把有块但没有任何有效正文或选项文案的场景标记为内容缺失", () => {
    const graph = buildSceneGraph(
      [
        {
          id: "s1",
          projectId: "p1",
          routeId: "r1",
          title: "只有结构块的场景",
          summary: "",
          sceneType: "normal",
          status: "draft",
          chapterLabel: "",
          sortOrder: 0,
          isStartScene: true,
          isEndingScene: true,
          notes: "",
          blocks: [
            {
              id: "b1",
              sceneId: "s1",
              blockType: "condition",
              sortOrder: 0,
              characterId: null,
              contentText: "",
              metaJson: JSON.stringify({
                conditions: [],
              }),
            },
            {
              id: "b2",
              sceneId: "s1",
              blockType: "note",
              sortOrder: 1,
              characterId: null,
              contentText: "   ",
              metaJson: null,
            },
            {
              id: "b3",
              sceneId: "s1",
              blockType: "choice",
              sortOrder: 2,
              characterId: null,
              contentText: "",
              metaJson: JSON.stringify({
                label: "   ",
                targetSceneId: null,
                effectVariableId: null,
                effectValue: 0,
              }),
            },
          ],
        },
      ],
      [],
      [],
    );

    expect(graph.issueSummaries).toEqual([
      expect.objectContaining({
        sceneId: "s1",
        categories: expect.arrayContaining(["内容缺失"]),
        issues: expect.arrayContaining([
          "当前场景还没有任何有效正文或选项文案",
        ]),
      }),
    ]);
  });

  it("只要存在一个有效正文或选项文案就不会命中内容缺失", () => {
    const graph = buildSceneGraph(
      [
        {
          id: "s1",
          projectId: "p1",
          routeId: "r1",
          title: "有有效内容的场景",
          summary: "",
          sceneType: "normal",
          status: "draft",
          chapterLabel: "",
          sortOrder: 0,
          isStartScene: true,
          isEndingScene: true,
          notes: "",
          blocks: [
            {
              id: "b1",
              sceneId: "s1",
              blockType: "note",
              sortOrder: 0,
              characterId: null,
              contentText: "   ",
              metaJson: null,
            },
            {
              id: "b2",
              sceneId: "s1",
              blockType: "dialogue",
              sortOrder: 1,
              characterId: null,
              contentText: "终于有正文了。",
              metaJson: null,
            },
            {
              id: "b3",
              sceneId: "s1",
              blockType: "choice",
              sortOrder: 2,
              characterId: null,
              contentText: "",
              metaJson: JSON.stringify({
                label: "   ",
                targetSceneId: null,
                effectVariableId: null,
                effectValue: 0,
              }),
            },
          ],
        },
      ],
      [],
      [],
    );

    expect(graph.issueSummaries).toEqual([]);
  });
});
