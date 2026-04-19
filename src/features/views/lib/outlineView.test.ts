import { describe, expect, it } from "vitest";
import { buildOutlineView } from "./outlineView";

describe("buildOutlineView", () => {
  it("会按路线和场景顺序生成大纲结构并统计入出边", () => {
    const sections = buildOutlineView(
      [
        {
          id: "r1",
          projectId: "p1",
          name: "共通线",
          routeType: "common",
          description: "",
          sortOrder: 0,
        },
      ],
      [
        {
          id: "s1",
          projectId: "p1",
          routeId: "r1",
          title: "开场",
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
          title: "结尾",
          summary: "",
          sceneType: "ending",
          status: "draft",
          chapterLabel: "",
          sortOrder: 1,
          isStartScene: false,
          isEndingScene: true,
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
          sourceBlockId: null,
          label: "继续",
          conditionId: null,
          priorityOrder: 0,
        },
      ],
    );

    expect(sections).toEqual([
      {
        routeId: "r1",
        routeName: "共通线",
        scenes: [
          expect.objectContaining({
            sceneId: "s1",
            incomingCount: 0,
            outgoingCount: 1,
          }),
          expect.objectContaining({
            sceneId: "s2",
            incomingCount: 1,
            outgoingCount: 0,
          }),
        ],
      },
    ]);
  });
});
