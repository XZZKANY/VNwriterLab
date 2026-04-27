import { describe, expect, it } from "vitest";
import { applySceneGraphFilters, buildSceneGraph } from "./graphData";

describe("buildSceneGraph", () => {
  it("会根据场景和连线生成分支图节点与边", () => {
    const graph = buildSceneGraph(
      [
        {
          id: "s1",
          projectId: "p1",
          routeId: "r1",
          title: "序章",
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
          title: "旧校舍",
          summary: "",
          sceneType: "branch",
          status: "draft",
          chapterLabel: "",
          sortOrder: 1,
          isStartScene: false,
          isEndingScene: false,
          notes: "",
          blocks: [],
        },
      ],
      [
        {
          id: "l1",
          projectId: "p1",
          fromSceneId: "s1",
          toSceneId: "s2",
          linkType: "choice",
          sourceBlockId: "b2",
          label: "去旧校舍",
          conditionId: null,
          priorityOrder: 0,
        },
      ],
    );

    expect(graph.nodes).toEqual([
      expect.objectContaining({
        id: "s1",
        data: expect.objectContaining({ label: "序章" }),
      }),
      expect.objectContaining({
        id: "s2",
        data: expect.objectContaining({ label: "旧校舍" }),
      }),
    ]);
    expect(graph.edges).toEqual([
      expect.objectContaining({
        source: "s1",
        target: "s2",
        label: "去旧校舍",
      }),
    ]);
  });

  it("会根据条件块和变量生成条件摘要", () => {
    const graph = buildSceneGraph(
      [
        {
          id: "s1",
          projectId: "p1",
          routeId: "r1",
          title: "序章",
          summary: "",
          sceneType: "normal",
          status: "draft",
          chapterLabel: "",
          sortOrder: 0,
          isStartScene: true,
          isEndingScene: false,
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
                variableId: "v1",
                operator: "gte",
                compareValue: 3,
              }),
            },
            {
              id: "b2",
              sceneId: "s1",
              blockType: "choice",
              sortOrder: 1,
              characterId: null,
              contentText: "",
              metaJson: JSON.stringify({
                label: "去问题节点",
                targetSceneId: "s2",
                effectVariableId: null,
                effectValue: 0,
              }),
            },
          ],
        },
      ],
      [
        {
          id: "l1",
          projectId: "p1",
          fromSceneId: "s1",
          toSceneId: "s1",
          linkType: "choice",
          sourceBlockId: "b2",
          label: "去旧校舍",
          conditionId: null,
          priorityOrder: 0,
        },
      ],
      [
        {
          id: "v1",
          projectId: "p1",
          name: "勇气值",
          variableType: "number",
          defaultValue: 2,
        },
      ],
    );

    expect(graph.conditionSummaries).toEqual([
      expect.objectContaining({
        sceneId: "s1",
        sceneTitle: "序章",
        linkId: "l1",
        linkLabel: "去旧校舍",
        summary: "勇气值 ≥ 3",
      }),
    ]);
  });

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

  it("会在单条路线筛选下只保留对应路线的节点、连线和摘要", () => {
    const graph = buildSceneGraph(
      [
        {
          id: "r1-s1",
          projectId: "p1",
          routeId: "r1",
          title: "路线一开端",
          summary: "",
          sceneType: "normal",
          status: "draft",
          chapterLabel: "",
          sortOrder: 0,
          isStartScene: true,
          isEndingScene: false,
          notes: "",
          blocks: [
            {
              id: "r1-b1",
              sceneId: "r1-s1",
              blockType: "condition",
              sortOrder: 0,
              characterId: null,
              contentText: "",
              metaJson: JSON.stringify({
                variableId: "v1",
                operator: "gte",
                compareValue: 3,
              }),
            },
            {
              id: "r1-b2",
              sceneId: "r1-s1",
              blockType: "choice",
              sortOrder: 1,
              characterId: null,
              contentText: "",
              metaJson: null,
            },
          ],
        },
        {
          id: "r1-s2",
          projectId: "p1",
          routeId: "r1",
          title: "路线一节点",
          summary: "",
          sceneType: "branch",
          status: "draft",
          chapterLabel: "",
          sortOrder: 1,
          isStartScene: false,
          isEndingScene: false,
          notes: "",
          blocks: [],
        },
        {
          id: "r2-s1",
          projectId: "p1",
          routeId: "r2",
          title: "路线二开端",
          summary: "",
          sceneType: "normal",
          status: "draft",
          chapterLabel: "",
          sortOrder: 0,
          isStartScene: true,
          isEndingScene: false,
          notes: "",
          blocks: [
            {
              id: "r2-b1",
              sceneId: "r2-s1",
              blockType: "condition",
              sortOrder: 0,
              characterId: null,
              contentText: "",
              metaJson: JSON.stringify({
                variableId: "v2",
                operator: "gte",
                compareValue: 5,
              }),
            },
            {
              id: "r2-b2",
              sceneId: "r2-s1",
              blockType: "choice",
              sortOrder: 1,
              characterId: null,
              contentText: "",
              metaJson: null,
            },
          ],
        },
        {
          id: "r2-s2",
          projectId: "p1",
          routeId: "r2",
          title: "路线二节点",
          summary: "",
          sceneType: "branch",
          status: "draft",
          chapterLabel: "",
          sortOrder: 1,
          isStartScene: false,
          isEndingScene: false,
          notes: "",
          blocks: [],
        },
      ],
      [
        {
          id: "r1-l1",
          projectId: "p1",
          fromSceneId: "r1-s1",
          toSceneId: "r1-s2",
          linkType: "choice",
          sourceBlockId: "r1-b2",
          label: "前往路线一节点",
          conditionId: null,
          priorityOrder: 0,
        },
        {
          id: "r2-l1",
          projectId: "p1",
          fromSceneId: "r2-s1",
          toSceneId: "r2-s2",
          linkType: "choice",
          sourceBlockId: "r2-b2",
          label: "前往路线二节点",
          conditionId: null,
          priorityOrder: 0,
        },
      ],
      [
        {
          id: "v1",
          projectId: "p1",
          name: "勇气值",
          variableType: "number",
          defaultValue: 2,
        },
        {
          id: "v2",
          projectId: "p1",
          name: "信赖值",
          variableType: "number",
          defaultValue: 1,
        },
      ],
    );

    const filtered = applySceneGraphFilters(graph, {
      routeFilter: "single",
      routeId: "r1",
      questionOnly: false,
    });

    expect(filtered.nodes.map((node) => node.id)).toEqual(["r1-s1", "r1-s2"]);
    expect(filtered.edges.map((edge) => edge.id)).toEqual(["r1-l1"]);
    expect(filtered.conditionSummaries).toEqual([
      expect.objectContaining({
        sceneId: "r1-s1",
        linkId: "r1-l1",
        summary: "勇气值 ≥ 3",
      }),
    ]);
  });

  it("会在只看问题节点时按当前子图收缩节点、连线和摘要", () => {
    const graph = buildSceneGraph(
      [
        {
          id: "s1",
          projectId: "p1",
          routeId: "r1",
          title: "起点",
          summary: "",
          sceneType: "normal",
          status: "draft",
          chapterLabel: "",
          sortOrder: 0,
          isStartScene: true,
          isEndingScene: false,
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
                variableId: "v1",
                operator: "gte",
                compareValue: 3,
              }),
            },
            {
              id: "b2",
              sceneId: "s1",
              blockType: "choice",
              sortOrder: 1,
              characterId: null,
              contentText: "",
              metaJson: JSON.stringify({
                label: "去问题节点",
                targetSceneId: "s2",
                effectVariableId: null,
                effectValue: 0,
              }),
            },
          ],
        },
        {
          id: "s2",
          projectId: "p1",
          routeId: "r1",
          title: "问题节点",
          summary: "",
          sceneType: "branch",
          status: "draft",
          chapterLabel: "",
          sortOrder: 1,
          isStartScene: false,
          isEndingScene: false,
          notes: "",
          blocks: [],
        },
        {
          id: "s3",
          projectId: "p1",
          routeId: "r1",
          title: "前置节点",
          summary: "",
          sceneType: "branch",
          status: "draft",
          chapterLabel: "",
          sortOrder: 2,
          isStartScene: false,
          isEndingScene: false,
          notes: "",
          blocks: [
            {
              id: "b3",
              sceneId: "s3",
              blockType: "condition",
              sortOrder: 0,
              characterId: null,
              contentText: "",
              metaJson: JSON.stringify({
                variableId: "v2",
                operator: "gte",
                compareValue: 5,
              }),
            },
            {
              id: "b4",
              sceneId: "s3",
              blockType: "choice",
              sortOrder: 1,
              characterId: null,
              contentText: "",
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
          sourceBlockId: "b2",
          label: "去问题节点",
          conditionId: null,
          priorityOrder: 0,
        },
        {
          id: "l2",
          projectId: "p1",
          fromSceneId: "s3",
          toSceneId: "s2",
          linkType: "choice",
          sourceBlockId: "b4",
          label: "从前置节点进入",
          conditionId: null,
          priorityOrder: 0,
        },
      ],
      [
        {
          id: "v1",
          projectId: "p1",
          name: "勇气值",
          variableType: "number",
          defaultValue: 2,
        },
        {
          id: "v2",
          projectId: "p1",
          name: "信赖值",
          variableType: "number",
          defaultValue: 1,
        },
      ],
    );

    const filtered = applySceneGraphFilters(graph, {
      routeFilter: "all",
      routeId: null,
      questionOnly: true,
    });

    expect(filtered.nodes.map((node) => node.id)).toEqual(["s2", "s3"]);
    expect(filtered.edges.map((edge) => edge.id)).toEqual(["l2"]);
    expect(filtered.conditionSummaries).toEqual([
      expect.objectContaining({
        sceneId: "s3",
        linkId: "l2",
        summary: "信赖值 ≥ 5",
      }),
    ]);
  });

  it("会生成问题原因明细并随筛选结果收缩", () => {
    const graph = buildSceneGraph(
      [
        {
          id: "r1-s1",
          projectId: "p1",
          routeId: "r1",
          title: "起点",
          summary: "",
          sceneType: "normal",
          status: "draft",
          chapterLabel: "",
          sortOrder: 0,
          isStartScene: true,
          isEndingScene: false,
          notes: "",
          blocks: [
            {
              id: "r1-b1",
              sceneId: "r1-s1",
              blockType: "condition",
              sortOrder: 0,
              characterId: null,
              contentText: "",
              metaJson: JSON.stringify({
                conditions: [
                  {
                    variableId: "deleted-variable",
                    operator: "gte",
                    compareValue: 3,
                  },
                  {
                    variableId: null,
                    operator: "isTrue",
                    compareValue: 1,
                  },
                ],
              }),
            },
            {
              id: "r1-b2",
              sceneId: "r1-s1",
              blockType: "choice",
              sortOrder: 1,
              characterId: null,
              contentText: "",
              metaJson: JSON.stringify({
                label: "前往问题节点",
                targetSceneId: "r1-s2",
              }),
            },
          ],
        },
        {
          id: "r1-s2",
          projectId: "p1",
          routeId: "r1",
          title: "问题节点",
          summary: "",
          sceneType: "branch",
          status: "draft",
          chapterLabel: "",
          sortOrder: 1,
          isStartScene: false,
          isEndingScene: true,
          notes: "",
          blocks: [],
        },
        {
          id: "r2-s1",
          projectId: "p1",
          routeId: "r2",
          title: "另一条路线",
          summary: "",
          sceneType: "normal",
          status: "draft",
          chapterLabel: "",
          sortOrder: 0,
          isStartScene: true,
          isEndingScene: false,
          notes: "",
          blocks: [
            {
              id: "r2-b1",
              sceneId: "r2-s1",
              blockType: "choice",
              sortOrder: 0,
              characterId: null,
              contentText: "",
              metaJson: JSON.stringify({
                label: "前往不存在的场景",
                targetSceneId: "missing-scene",
                effectVariableId: "deleted-effect-variable",
                effectValue: 1,
              }),
            },
          ],
        },
      ],
      [
        {
          id: "r1-l1",
          projectId: "p1",
          fromSceneId: "r1-s1",
          toSceneId: "r1-s2",
          linkType: "choice",
          sourceBlockId: "r1-b2",
          label: "前往问题节点",
          conditionId: null,
          priorityOrder: 0,
        },
        {
          id: "r2-l1",
          projectId: "p1",
          fromSceneId: "r2-s1",
          toSceneId: "missing-scene",
          linkType: "choice",
          sourceBlockId: "r2-b1",
          label: "前往不存在的场景",
          conditionId: null,
          priorityOrder: 0,
        },
      ],
      [
        {
          id: "v1",
          projectId: "p1",
          name: "勇气值",
          variableType: "number",
          defaultValue: 2,
        },
      ],
    );

    expect(graph.issueSummaries).toHaveLength(3);
    expect(graph.issueSummaries).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          sceneId: "r1-s1",
          sceneTitle: "起点",
          issues: ["条件块引用了已删除变量", "条件块未选择变量"],
        }),
        expect.objectContaining({
          sceneId: "r1-s2",
          sceneTitle: "问题节点",
          categories: ["空场景"],
          issues: ["当前场景还没有任何内容块"],
        }),
        expect.objectContaining({
          sceneId: "r2-s1",
          sceneTitle: "另一条路线",
          issues: ["选项块跳转到不存在的场景", "选项块副作用引用了已删除变量"],
        }),
      ]),
    );

    const filtered = applySceneGraphFilters(graph, {
      routeFilter: "single",
      routeId: "r1",
      questionOnly: false,
    });

    expect(filtered.nodes.map((node) => node.id)).toEqual(["r1-s1", "r1-s2"]);
    expect(filtered.issueSummaries).toEqual([
      expect.objectContaining({
        sceneId: "r1-s1",
        issues: ["条件块引用了已删除变量", "条件块未选择变量"],
      }),
      expect.objectContaining({
        sceneId: "r1-s2",
        categories: ["空场景"],
        issues: ["当前场景还没有任何内容块"],
      }),
    ]);
  });

  it("会把未回收伏笔标记为问题并在摘要中展示任一条件", () => {
    const graph = buildSceneGraph(
      [
        {
          id: "s1",
          projectId: "p1",
          routeId: "r1",
          title: "埋线场景",
          summary: "",
          sceneType: "normal",
          status: "draft",
          chapterLabel: "",
          sortOrder: 0,
          isStartScene: true,
          isEndingScene: false,
          notes: "",
          blocks: [
            {
              id: "c1",
              sceneId: "s1",
              blockType: "condition",
              sortOrder: 0,
              characterId: null,
              contentText: "",
              metaJson: JSON.stringify({
                logicMode: "any",
                conditions: [
                  {
                    variableId: "v1",
                    operator: "isTrue",
                    compareValue: 1,
                  },
                  {
                    variableId: "v2",
                    operator: "gte",
                    compareValue: 2,
                  },
                ],
              }),
            },
            {
              id: "b1",
              sceneId: "s1",
              blockType: "choice",
              sortOrder: 1,
              characterId: null,
              contentText: "",
              metaJson: JSON.stringify({
                label: "继续",
                targetSceneId: "s2",
              }),
            },
            {
              id: "n1",
              sceneId: "s1",
              blockType: "note",
              sortOrder: 2,
              characterId: null,
              contentText: "钥匙伏笔",
              metaJson: JSON.stringify({
                noteType: "foreshadow",
                threadId: "old-school-key",
              }),
            },
          ],
        },
        {
          id: "s2",
          projectId: "p1",
          routeId: "r1",
          title: "后续场景",
          summary: "",
          sceneType: "branch",
          status: "draft",
          chapterLabel: "",
          sortOrder: 1,
          isStartScene: false,
          isEndingScene: false,
          notes: "",
          blocks: [],
        },
      ],
      [
        {
          id: "l1",
          projectId: "p1",
          fromSceneId: "s1",
          toSceneId: "s2",
          linkType: "choice",
          sourceBlockId: "b1",
          label: "继续",
          conditionId: null,
          priorityOrder: 0,
        },
      ],
      [
        {
          id: "v1",
          projectId: "p1",
          name: "钥匙",
          variableType: "flag",
          defaultValue: 1,
        },
        {
          id: "v2",
          projectId: "p1",
          name: "勇气",
          variableType: "number",
          defaultValue: 0,
        },
      ],
    );

    expect(graph.conditionSummaries).toEqual([
      expect.objectContaining({
        sceneId: "s1",
        summary: "任一满足：钥匙 为真；勇气 ≥ 2",
      }),
    ]);
    expect(graph.issueSummaries).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          sceneId: "s1",
          categories: expect.arrayContaining(["伏笔未回收"]),
          issues: expect.arrayContaining(["伏笔「钥匙伏笔」尚未找到回收点"]),
        }),
      ]),
    );
  });
});
