import { resolveNextSceneId } from "./previewEngine";

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
