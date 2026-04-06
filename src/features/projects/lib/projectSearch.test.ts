import { describe, expect, it } from "vitest";
import { searchProjectContent } from "./projectSearch";

describe("searchProjectContent", () => {
  const project = {
    id: "p1",
    name: "雨夜回响",
    summary: "",
    projectType: "route_based" as const,
    routes: [],
    scenes: [
      {
        id: "s1",
        projectId: "p1",
        routeId: "r1",
        title: "旧校舍入口",
        summary: "今夜再次听见脚步声。",
        sceneType: "normal" as const,
        status: "draft" as const,
        chapterLabel: "",
        sortOrder: 0,
        isStartScene: true,
        isEndingScene: false,
        notes: "",
        blocks: [
          {
            id: "b1",
            sceneId: "s1",
            blockType: "narration" as const,
            sortOrder: 0,
            characterId: null,
            contentText: "林夏站在旧校舍门外。",
            metaJson: null,
          },
        ],
      },
    ],
  };

  it("空关键词时返回空结果", () => {
    expect(
      searchProjectContent("   ", {
        project,
        editorScenes: project.scenes,
        characters: [],
        loreEntries: [],
      }),
    ).toEqual({
      sceneResults: [],
      characterResults: [],
      loreResults: [],
    });
  });

  it("会按场景、角色、设定分组返回命中结果", () => {
    const result = searchProjectContent("旧校舍", {
      project,
      editorScenes: project.scenes,
      characters: [
        {
          id: "c1",
          projectId: "p1",
          name: "林夏",
          identity: "旧校舍守门人",
          appearance: "",
          personality: "",
          goal: "",
          secret: "",
          routeId: null,
          notes: "",
        },
      ],
      loreEntries: [
        {
          id: "l1",
          projectId: "p1",
          name: "旧校舍",
          category: "location",
          description: "传闻不断的旧建筑。",
          tags: ["校园"],
        },
      ],
    });

    expect(result.sceneResults).toEqual([
      expect.objectContaining({
        sceneId: "s1",
        sceneTitle: "旧校舍入口",
        matchedFields: ["标题", "正文块 1"],
      }),
    ]);
    expect(result.characterResults).toEqual([
      expect.objectContaining({
        characterId: "c1",
        characterName: "林夏",
        matchedFields: ["身份"],
      }),
    ]);
    expect(result.loreResults).toEqual([
      expect.objectContaining({
        loreId: "l1",
        loreName: "旧校舍",
        matchedFields: ["名称"],
        snippet: "旧校舍",
      }),
    ]);
  });

  it("会优先使用当前项目内的最新编辑器场景数据", () => {
    const result = searchProjectContent("修订后标题", {
      project,
      editorScenes: [
        {
          ...project.scenes[0],
          title: "修订后标题",
          summary: "修订后的摘要。",
          blocks: [
            {
              ...project.scenes[0].blocks[0],
              contentText: "修订后的正文。",
            },
          ],
        },
      ],
      characters: [],
      loreEntries: [],
    });

    expect(result.sceneResults).toEqual([
      expect.objectContaining({
        sceneId: "s1",
        sceneTitle: "修订后标题",
        matchedFields: ["标题"],
        snippet: "修订后标题",
      }),
    ]);
  });
});
