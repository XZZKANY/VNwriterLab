import { canEnterScene, resolveNextSceneId } from "./previewEngine";

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
