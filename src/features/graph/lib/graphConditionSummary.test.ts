import { describe, expect, it } from "vitest";
import type { SceneBlock } from "@/lib/domain/block";
import type { Scene } from "@/lib/domain/scene";
import type { ProjectVariable } from "@/lib/domain/variable";
import { stringifyConditionBlockMeta } from "@/features/editor/store/conditionBlock";
import {
  collectConditionBlocks,
  formatConditionSummary,
} from "./graphConditionSummary";

function makeBlock(overrides: Partial<SceneBlock> = {}): SceneBlock {
  return {
    id: "b1",
    sceneId: "s1",
    blockType: "narration",
    sortOrder: 0,
    characterId: null,
    contentText: "",
    metaJson: null,
    ...overrides,
  };
}

function makeScene(blocks: SceneBlock[]): Scene {
  return {
    id: "s1",
    projectId: "p1",
    routeId: "r1",
    title: "测试",
    summary: "",
    sceneType: "normal",
    status: "draft",
    chapterLabel: "",
    sortOrder: 0,
    isStartScene: false,
    isEndingScene: false,
    notes: "",
    blocks,
  };
}

function makeVariable(
  overrides: Partial<ProjectVariable> = {},
): ProjectVariable {
  return {
    id: "v1",
    projectId: "p1",
    name: "拥有钥匙",
    variableType: "flag",
    defaultValue: 0,
    ...overrides,
  };
}

describe("formatConditionSummary", () => {
  it("空 conditions 返回'无条件'", () => {
    const block = makeBlock({
      blockType: "condition",
      metaJson: stringifyConditionBlockMeta({
        logicMode: "all",
        conditions: [],
      }),
    });
    expect(formatConditionSummary(block, new Map())).toBe("无条件");
  });

  it("isTrue 算子用'变量名 为真'格式", () => {
    const variable = makeVariable({ id: "v1", name: "拥有钥匙" });
    const block = makeBlock({
      blockType: "condition",
      metaJson: stringifyConditionBlockMeta({
        logicMode: "all",
        conditions: [{ variableId: "v1", operator: "isTrue", compareValue: 1 }],
      }),
    });
    expect(
      formatConditionSummary(block, new Map([[variable.id, variable]])),
    ).toBe("拥有钥匙 为真");
  });

  it("gte 算子用'变量名 ≥ 值'格式", () => {
    const variable = makeVariable({
      id: "v1",
      name: "勇气",
      variableType: "number",
    });
    const block = makeBlock({
      blockType: "condition",
      metaJson: stringifyConditionBlockMeta({
        logicMode: "all",
        conditions: [{ variableId: "v1", operator: "gte", compareValue: 5 }],
      }),
    });
    expect(
      formatConditionSummary(block, new Map([[variable.id, variable]])),
    ).toBe("勇气 ≥ 5");
  });

  it("引用了已删除变量时显示'已删除变量'占位", () => {
    const block = makeBlock({
      blockType: "condition",
      metaJson: stringifyConditionBlockMeta({
        logicMode: "all",
        conditions: [
          { variableId: "ghost", operator: "isTrue", compareValue: 1 },
        ],
      }),
    });
    expect(formatConditionSummary(block, new Map())).toBe("已删除变量 为真");
  });

  it("variableId 为 null 时显示'未选择变量'", () => {
    const block = makeBlock({
      blockType: "condition",
      metaJson: stringifyConditionBlockMeta({
        logicMode: "all",
        conditions: [{ variableId: null, operator: "isTrue", compareValue: 1 }],
      }),
    });
    expect(formatConditionSummary(block, new Map())).toBe("未选择变量 为真");
  });

  it("logicMode === 'any' 时整体加'任一满足：'前缀，且多项用'；'连接", () => {
    const v1 = makeVariable({ id: "v1", name: "A" });
    const v2 = makeVariable({ id: "v2", name: "B" });
    const block = makeBlock({
      blockType: "condition",
      metaJson: stringifyConditionBlockMeta({
        logicMode: "any",
        conditions: [
          { variableId: "v1", operator: "isTrue", compareValue: 1 },
          { variableId: "v2", operator: "gte", compareValue: 3 },
        ],
      }),
    });
    expect(
      formatConditionSummary(
        block,
        new Map([
          [v1.id, v1],
          [v2.id, v2],
        ]),
      ),
    ).toBe("任一满足：A 为真；B ≥ 3");
  });

  it("默认 logicMode（all）多项时不带前缀", () => {
    const v1 = makeVariable({ id: "v1", name: "A" });
    const v2 = makeVariable({ id: "v2", name: "B" });
    const block = makeBlock({
      blockType: "condition",
      metaJson: stringifyConditionBlockMeta({
        logicMode: "all",
        conditions: [
          { variableId: "v1", operator: "isTrue", compareValue: 1 },
          { variableId: "v2", operator: "isTrue", compareValue: 1 },
        ],
      }),
    });
    expect(
      formatConditionSummary(
        block,
        new Map([
          [v1.id, v1],
          [v2.id, v2],
        ]),
      ),
    ).toBe("A 为真；B 为真");
  });
});

describe("collectConditionBlocks", () => {
  it("sourceBlockId 为 null 返回空列表", () => {
    expect(collectConditionBlocks(makeScene([]), null)).toEqual([]);
  });

  it("scene 内找不到 sourceBlockId 时返回空列表", () => {
    const scene = makeScene([
      makeBlock({ id: "exists", sortOrder: 0, blockType: "narration" }),
    ]);
    expect(collectConditionBlocks(scene, "missing")).toEqual([]);
  });

  it("sourceBlock 在 sortOrder 0 时（前面没块）返回空", () => {
    const scene = makeScene([
      makeBlock({ id: "src", sortOrder: 0, blockType: "choice" }),
    ]);
    expect(collectConditionBlocks(scene, "src")).toEqual([]);
  });

  it("仅返回 sourceBlock 之前连续的 condition 块，遇到非 condition 即停止", () => {
    const scene = makeScene([
      makeBlock({ id: "narration1", sortOrder: 0, blockType: "narration" }),
      makeBlock({ id: "cond1", sortOrder: 1, blockType: "condition" }),
      makeBlock({ id: "cond2", sortOrder: 2, blockType: "condition" }),
      makeBlock({ id: "src", sortOrder: 3, blockType: "choice" }),
    ]);
    const result = collectConditionBlocks(scene, "src");
    expect(result.map((block) => block.id)).toEqual(["cond1", "cond2"]);
  });

  it("sourceBlock 之前连续 condition 中间夹着 narration 时只回溯到 narration 之后的部分", () => {
    const scene = makeScene([
      makeBlock({ id: "cond_outer", sortOrder: 0, blockType: "condition" }),
      makeBlock({ id: "narration", sortOrder: 1, blockType: "narration" }),
      makeBlock({ id: "cond_inner", sortOrder: 2, blockType: "condition" }),
      makeBlock({ id: "src", sortOrder: 3, blockType: "choice" }),
    ]);
    const result = collectConditionBlocks(scene, "src");
    expect(result.map((block) => block.id)).toEqual(["cond_inner"]);
  });

  it("blocks 入参 sortOrder 乱序也能正确按顺序回溯", () => {
    const scene = makeScene([
      makeBlock({ id: "src", sortOrder: 2, blockType: "choice" }),
      makeBlock({ id: "cond1", sortOrder: 0, blockType: "condition" }),
      makeBlock({ id: "cond2", sortOrder: 1, blockType: "condition" }),
    ]);
    const result = collectConditionBlocks(scene, "src");
    expect(result.map((block) => block.id)).toEqual(["cond1", "cond2"]);
  });
});
