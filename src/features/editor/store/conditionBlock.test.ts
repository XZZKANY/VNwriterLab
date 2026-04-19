import { describe, expect, it } from "vitest";
import {
  parseConditionBlockMeta,
  stringifyConditionBlockMeta,
} from "./conditionBlock";

describe("conditionBlock", () => {
  it("兼容旧格式并默认逻辑为 all", () => {
    const parsed = parseConditionBlockMeta(
      JSON.stringify({
        variableId: "v1",
        operator: "gte",
        compareValue: 3,
      }),
    );

    expect(parsed.logicMode).toBe("all");
    expect(parsed.conditions).toEqual([
      {
        variableId: "v1",
        operator: "gte",
        compareValue: 3,
      },
    ]);
  });

  it("支持解析 any 逻辑", () => {
    const parsed = parseConditionBlockMeta(
      JSON.stringify({
        logicMode: "any",
        conditions: [
          { variableId: "v1", operator: "isTrue", compareValue: 1 },
          { variableId: "v2", operator: "gte", compareValue: 2 },
        ],
      }),
    );

    expect(parsed.logicMode).toBe("any");
    expect(parsed.conditions).toHaveLength(2);
  });

  it("序列化会保留逻辑模式", () => {
    const metaJson = stringifyConditionBlockMeta({
      logicMode: "any",
      conditions: [{ variableId: null, operator: "isTrue", compareValue: 1 }],
    });

    expect(JSON.parse(metaJson)).toEqual({
      logicMode: "any",
      conditions: [{ variableId: null, operator: "isTrue", compareValue: 1 }],
    });
  });
});
