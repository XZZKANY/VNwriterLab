import { buildChoiceLink } from "./linkUtils";

describe("buildChoiceLink", () => {
  it("根据选项块生成 choice 类型连接", () => {
    const link = buildChoiceLink({
      projectId: "p1",
      fromSceneId: "s1",
      toSceneId: "s2",
      sourceBlockId: "b1",
      label: "去旧校舍",
    });

    expect(link.linkType).toBe("choice");
    expect(link.label).toBe("去旧校舍");
    expect(link.fromSceneId).toBe("s1");
    expect(link.toSceneId).toBe("s2");
  });
});
