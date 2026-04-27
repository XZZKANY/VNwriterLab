import { describe, expect, it } from "vitest";
import type { LoreEntry } from "@/lib/domain/lore";
import type { Scene } from "@/lib/domain/scene";
import type { SceneBlock } from "@/lib/domain/block";
import {
  collectLoreKeywords,
  normalizeKeyword,
  resolveLoreSceneAssociations,
} from "./loreSceneAssociations";

function makeEntry(overrides: Partial<LoreEntry> = {}): LoreEntry {
  return {
    id: "lore-1",
    projectId: "p1",
    name: "旧校舍",
    category: "location",
    description: "",
    tags: [],
    ...overrides,
  };
}

function makeBlock(overrides: Partial<SceneBlock> = {}): SceneBlock {
  return {
    id: "block-1",
    sceneId: "scene-1",
    blockType: "narration",
    sortOrder: 0,
    characterId: null,
    contentText: "",
    metaJson: null,
    ...overrides,
  };
}

function makeScene(overrides: Partial<Scene> = {}): Scene {
  return {
    id: "scene-1",
    projectId: "p1",
    routeId: "route-1",
    title: "未命名场景",
    summary: "",
    sceneType: "normal",
    status: "draft",
    chapterLabel: "",
    sortOrder: 0,
    isStartScene: false,
    isEndingScene: false,
    notes: "",
    blocks: [],
    ...overrides,
  };
}

describe("normalizeKeyword", () => {
  it("去除首尾空白并转小写", () => {
    expect(normalizeKeyword("  Old School  ")).toBe("old school");
  });

  it("空字符串转换后仍为空字符串", () => {
    expect(normalizeKeyword("   ")).toBe("");
  });
});

describe("collectLoreKeywords", () => {
  it("把 name 和 tags 合并、归一化、过滤空字符串", () => {
    const entry = makeEntry({
      name: "  旧校舍 ",
      tags: ["", "  ", "鬼故事", "OLD"],
    });

    expect(collectLoreKeywords(entry)).toEqual(["旧校舍", "鬼故事", "old"]);
  });

  it("当 name 与 tags 全为空白时返回空列表", () => {
    expect(
      collectLoreKeywords(makeEntry({ name: "  ", tags: ["", " "] })),
    ).toEqual([]);
  });
});

describe("resolveLoreSceneAssociations", () => {
  it("没有关键词时返回空列表", () => {
    const entry = makeEntry({ name: "", tags: [] });
    expect(resolveLoreSceneAssociations(entry, [makeScene()])).toEqual([]);
  });

  it("命中标题、简介或正文块时各自加入命中字段并去重", () => {
    const entry = makeEntry({ name: "旧校舍", tags: [] });
    const scene = makeScene({
      title: "旧校舍探险",
      summary: "调查旧校舍的传闻",
      blocks: [
        makeBlock({ contentText: "听说旧校舍真的闹鬼。" }),
        makeBlock({ id: "block-2", contentText: "完全无关。" }),
      ],
    });

    const result = resolveLoreSceneAssociations(entry, [scene]);

    expect(result).toHaveLength(1);
    expect(result[0]?.matchedFields).toEqual(["标题", "简介", "正文块 1"]);
    expect(result[0]?.snippet).toBe("旧校舍探险");
    expect(result[0]?.sceneTitle).toBe("旧校舍探险");
  });

  it("空标题场景退化为'未命名场景'但仍按其他字段匹配", () => {
    const entry = makeEntry({ name: "旧校舍", tags: [] });
    const scene = makeScene({
      title: "",
      summary: "旧校舍的故事",
      blocks: [],
    });

    const result = resolveLoreSceneAssociations(entry, [scene]);

    expect(result).toHaveLength(1);
    expect(result[0]?.sceneTitle).toBe("未命名场景");
    expect(result[0]?.matchedFields).toEqual(["简介"]);
    expect(result[0]?.snippet).toBe("旧校舍的故事");
  });

  it("一个场景没有命中时不出现在结果中", () => {
    const entry = makeEntry({ name: "旧校舍", tags: [] });
    const scenes = [
      makeScene({ id: "s1", title: "旧校舍探险" }),
      makeScene({ id: "s2", title: "天台对话", summary: "无关内容" }),
    ];

    const result = resolveLoreSceneAssociations(entry, scenes);
    expect(result.map((item) => item.sceneId)).toEqual(["s1"]);
  });

  it("匹配大小写不敏感", () => {
    const entry = makeEntry({ name: "OLD", tags: [] });
    const scene = makeScene({ title: "old school" });

    expect(resolveLoreSceneAssociations(entry, [scene])).toHaveLength(1);
  });
});
