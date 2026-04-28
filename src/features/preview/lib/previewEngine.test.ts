import { describe, expect, it } from "vitest";
import type { SceneBlock } from "@/lib/domain/block";
import type { ProjectVariable } from "@/lib/domain/variable";
import { stringifyChoiceBlockMeta } from "@/features/editor/store/choiceBlock";
import { stringifyConditionBlockMeta } from "@/features/editor/store/conditionBlock";
import {
  applyChoiceEffect,
  canEnterScene,
  resolveNextSceneId,
  resolveVisibleBlocks,
} from "./previewEngine";

function makeBlock(overrides: Partial<SceneBlock>): SceneBlock {
  return {
    id: "b",
    sceneId: "s",
    blockType: "narration",
    sortOrder: 0,
    characterId: null,
    contentText: "",
    metaJson: null,
    ...overrides,
  };
}

function makeVariable(overrides: Partial<ProjectVariable>): ProjectVariable {
  return {
    id: "v",
    projectId: "p",
    name: "var",
    variableType: "flag",
    defaultValue: 0,
    ...overrides,
  };
}

describe("resolveNextSceneId", () => {
  it("根据选项标签返回下一个场景 id", () => {
    const nextSceneId = resolveNextSceneId(
      [
        {
          id: "l1",
          projectId: "p1",
          fromSceneId: "s1",
          toSceneId: "s2",
          linkType: "choice",
          sourceBlockId: "b1",
          label: "去旧校舍",
          conditionId: null,
          priorityOrder: 0,
        },
      ],
      "s1",
      "去旧校舍",
    );

    expect(nextSceneId).toBe("s2");
  });
});

describe("canEnterScene", () => {
  it("逻辑为 all 时需要全部条件满足", () => {
    const result = canEnterScene(
      [
        {
          id: "c1",
          sceneId: "s1",
          blockType: "condition",
          sortOrder: 0,
          characterId: null,
          contentText: "",
          metaJson: JSON.stringify({
            logicMode: "all",
            conditions: [
              { variableId: "v1", operator: "isTrue", compareValue: 1 },
              { variableId: "v2", operator: "gte", compareValue: 2 },
            ],
          }),
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
          defaultValue: 1,
        },
      ],
    );

    expect(result).toBe(false);
  });

  it("逻辑为 any 时满足任一条件即可进入", () => {
    const result = canEnterScene(
      [
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
              { variableId: "v1", operator: "isTrue", compareValue: 1 },
              { variableId: "v2", operator: "gte", compareValue: 2 },
            ],
          }),
        },
      ],
      [
        {
          id: "v1",
          projectId: "p1",
          name: "钥匙",
          variableType: "flag",
          defaultValue: 0,
        },
        {
          id: "v2",
          projectId: "p1",
          name: "勇气",
          variableType: "number",
          defaultValue: 3,
        },
      ],
    );

    expect(result).toBe(true);
  });
});

describe("resolveVisibleBlocks", () => {
  it("无条件块时按 sortOrder 升序返回所有非条件块", () => {
    const blocks = [
      makeBlock({ id: "b2", blockType: "dialogue", sortOrder: 1 }),
      makeBlock({ id: "b1", blockType: "narration", sortOrder: 0 }),
    ];
    const result = resolveVisibleBlocks(blocks, []);
    expect(result.map((block) => block.id)).toEqual(["b1", "b2"]);
  });

  it("不能进入场景时返回空数组", () => {
    const conditionMeta = stringifyConditionBlockMeta({
      logicMode: "all",
      conditions: [
        { variableId: "missing", operator: "isTrue", compareValue: 1 },
      ],
    });
    const blocks = [
      makeBlock({
        id: "cond",
        blockType: "condition",
        sortOrder: 0,
        metaJson: conditionMeta,
      }),
      makeBlock({ id: "narr", blockType: "narration", sortOrder: 1 }),
    ];
    expect(resolveVisibleBlocks(blocks, [])).toEqual([]);
  });

  it("条件块紧跟选项块时不满足条件就跳过该选项", () => {
    const trueCond = stringifyConditionBlockMeta({
      logicMode: "all",
      conditions: [{ variableId: "v1", operator: "isTrue", compareValue: 1 }],
    });
    const falseCond = stringifyConditionBlockMeta({
      logicMode: "all",
      conditions: [{ variableId: "v2", operator: "isTrue", compareValue: 1 }],
    });
    const blocks = [
      makeBlock({ id: "narr", blockType: "narration", sortOrder: 0 }),
      makeBlock({
        id: "cond_pass",
        blockType: "condition",
        sortOrder: 1,
        metaJson: trueCond,
      }),
      makeBlock({
        id: "choice_pass",
        blockType: "choice",
        sortOrder: 2,
        metaJson: stringifyChoiceBlockMeta({
          label: "通过",
          targetSceneId: "s2",
          effectVariableId: null,
          effectValue: 0,
        }),
      }),
      makeBlock({
        id: "cond_fail",
        blockType: "condition",
        sortOrder: 3,
        metaJson: falseCond,
      }),
      makeBlock({
        id: "choice_fail",
        blockType: "choice",
        sortOrder: 4,
        metaJson: stringifyChoiceBlockMeta({
          label: "失败",
          targetSceneId: "s3",
          effectVariableId: null,
          effectValue: 0,
        }),
      }),
    ];
    const variables = [
      makeVariable({ id: "v1", defaultValue: 1 }),
      makeVariable({ id: "v2", defaultValue: 0 }),
    ];

    const result = resolveVisibleBlocks(blocks, variables);
    const ids = result.map((block) => block.id);
    expect(ids).toContain("narr");
    expect(ids).toContain("choice_pass");
    expect(ids).not.toContain("choice_fail");
  });

  it("条件块不被任何选项块紧跟时只是不显示自己", () => {
    const failCond = stringifyConditionBlockMeta({
      logicMode: "all",
      conditions: [{ variableId: "v1", operator: "isTrue", compareValue: 1 }],
    });
    const blocks = [
      makeBlock({ id: "narr1", blockType: "narration", sortOrder: 0 }),
      makeBlock({
        id: "cond",
        blockType: "condition",
        sortOrder: 1,
        metaJson: failCond,
      }),
      makeBlock({ id: "narr2", blockType: "narration", sortOrder: 2 }),
    ];
    const variables = [makeVariable({ id: "v1", defaultValue: 0 })];

    const result = resolveVisibleBlocks(blocks, variables);
    const ids = result.map((block) => block.id);
    expect(ids).toEqual(["narr1", "narr2"]);
  });
});

describe("applyChoiceEffect", () => {
  it("metaJson 为 null 时返回原变量数组（同引用）", () => {
    const variables = [makeVariable({ id: "v1", defaultValue: 0 })];
    expect(applyChoiceEffect(variables, null)).toBe(variables);
  });

  it("effectVariableId 为空时返回原变量数组", () => {
    const meta = stringifyChoiceBlockMeta({
      label: "x",
      targetSceneId: null,
      effectVariableId: null,
      effectValue: 1,
    });
    const variables = [makeVariable({ id: "v1", defaultValue: 0 })];
    expect(applyChoiceEffect(variables, meta)).toBe(variables);
  });

  it("flag 类型变量：effectValue > 0 → defaultValue 设为 1", () => {
    const meta = stringifyChoiceBlockMeta({
      label: "拿钥匙",
      targetSceneId: null,
      effectVariableId: "v1",
      effectValue: 1,
    });
    const variables = [
      makeVariable({ id: "v1", variableType: "flag", defaultValue: 0 }),
    ];
    const next = applyChoiceEffect(variables, meta);
    expect(next[0]?.defaultValue).toBe(1);
  });

  it("flag 类型变量：effectValue ≤ 0 → defaultValue 设为 0", () => {
    const meta = stringifyChoiceBlockMeta({
      label: "丢钥匙",
      targetSceneId: null,
      effectVariableId: "v1",
      effectValue: -3,
    });
    const variables = [
      makeVariable({ id: "v1", variableType: "flag", defaultValue: 1 }),
    ];
    expect(applyChoiceEffect(variables, meta)[0]?.defaultValue).toBe(0);
  });

  it("number 类型变量：直接设为 effectValue", () => {
    const meta = stringifyChoiceBlockMeta({
      label: "提升勇气",
      targetSceneId: null,
      effectVariableId: "v1",
      effectValue: 7,
    });
    const variables = [
      makeVariable({ id: "v1", variableType: "number", defaultValue: 2 }),
    ];
    expect(applyChoiceEffect(variables, meta)[0]?.defaultValue).toBe(7);
  });

  it("不影响其他变量", () => {
    const meta = stringifyChoiceBlockMeta({
      label: "x",
      targetSceneId: null,
      effectVariableId: "v1",
      effectValue: 1,
    });
    const variables = [
      makeVariable({ id: "v1", variableType: "flag", defaultValue: 0 }),
      makeVariable({ id: "v2", variableType: "number", defaultValue: 5 }),
    ];
    const next = applyChoiceEffect(variables, meta);
    expect(next[1]?.defaultValue).toBe(5);
  });
});
