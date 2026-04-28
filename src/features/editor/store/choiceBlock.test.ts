import { describe, expect, it } from "vitest";
import {
  clearChoiceBlockEffectVariableId,
  clearChoiceBlockTargetSceneId,
  parseChoiceBlockMeta,
  stringifyChoiceBlockMeta,
  type ChoiceBlockMeta,
} from "./choiceBlock";

const DEFAULT_META: ChoiceBlockMeta = {
  label: "",
  targetSceneId: null,
  effectVariableId: null,
  effectValue: 0,
};

describe("parseChoiceBlockMeta", () => {
  it("metaJson 为 null 时返回默认 meta", () => {
    expect(parseChoiceBlockMeta(null)).toEqual(DEFAULT_META);
  });

  it("metaJson 为空字符串时返回默认 meta", () => {
    expect(parseChoiceBlockMeta("")).toEqual(DEFAULT_META);
  });

  it("解析非法 JSON 不抛错，返回默认 meta", () => {
    expect(parseChoiceBlockMeta("not a json {{")).toEqual(DEFAULT_META);
  });

  it("缺少字段的 JSON 用类型守卫退化为默认值", () => {
    expect(parseChoiceBlockMeta("{}")).toEqual(DEFAULT_META);
  });

  it("字段类型错误时退化（label 不是字符串、effectValue 不是数字）", () => {
    expect(
      parseChoiceBlockMeta(
        JSON.stringify({
          label: 42,
          targetSceneId: 33,
          effectVariableId: true,
          effectValue: "10",
        }),
      ),
    ).toEqual(DEFAULT_META);
  });

  it("正常 JSON 完整解析", () => {
    const meta: ChoiceBlockMeta = {
      label: "前往天台",
      targetSceneId: "scene-2",
      effectVariableId: "var-courage",
      effectValue: 3,
    };
    expect(parseChoiceBlockMeta(JSON.stringify(meta))).toEqual(meta);
  });
});

describe("stringifyChoiceBlockMeta", () => {
  it("产物可被 parseChoiceBlockMeta 还原", () => {
    const meta: ChoiceBlockMeta = {
      label: "拿钥匙",
      targetSceneId: "scene-3",
      effectVariableId: "var-key",
      effectValue: 1,
    };
    expect(parseChoiceBlockMeta(stringifyChoiceBlockMeta(meta))).toEqual(meta);
  });
});

describe("clearChoiceBlockTargetSceneId", () => {
  it("metaJson 为 null 时透传 null", () => {
    expect(clearChoiceBlockTargetSceneId(null, "scene-1")).toBeNull();
  });

  it("targetSceneId 不匹配时返回原 metaJson 引用（不变）", () => {
    const original = stringifyChoiceBlockMeta({
      ...DEFAULT_META,
      targetSceneId: "scene-1",
    });
    expect(clearChoiceBlockTargetSceneId(original, "scene-other")).toBe(
      original,
    );
  });

  it("targetSceneId 匹配时清空字段，但其他字段保留", () => {
    const original = stringifyChoiceBlockMeta({
      label: "前往",
      targetSceneId: "scene-1",
      effectVariableId: "var-x",
      effectValue: 5,
    });
    const cleared = clearChoiceBlockTargetSceneId(original, "scene-1")!;
    const parsed = parseChoiceBlockMeta(cleared);
    expect(parsed.targetSceneId).toBeNull();
    expect(parsed.label).toBe("前往");
    expect(parsed.effectVariableId).toBe("var-x");
    expect(parsed.effectValue).toBe(5);
  });
});

describe("clearChoiceBlockEffectVariableId", () => {
  it("metaJson 为 null 时透传 null", () => {
    expect(clearChoiceBlockEffectVariableId(null, "var-1")).toBeNull();
  });

  it("variableId 不匹配时返回原 metaJson 引用", () => {
    const original = stringifyChoiceBlockMeta({
      ...DEFAULT_META,
      effectVariableId: "var-1",
    });
    expect(clearChoiceBlockEffectVariableId(original, "var-other")).toBe(
      original,
    );
  });

  it("variableId 匹配时清空字段，其他字段保留", () => {
    const original = stringifyChoiceBlockMeta({
      label: "拿钥匙",
      targetSceneId: "scene-2",
      effectVariableId: "var-1",
      effectValue: 1,
    });
    const cleared = clearChoiceBlockEffectVariableId(original, "var-1")!;
    const parsed = parseChoiceBlockMeta(cleared);
    expect(parsed.effectVariableId).toBeNull();
    expect(parsed.label).toBe("拿钥匙");
    expect(parsed.targetSceneId).toBe("scene-2");
    expect(parsed.effectValue).toBe(1);
  });
});
