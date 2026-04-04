import { createEmptyProject } from "./project";

describe("createEmptyProject", () => {
  it("生成带默认共通线的空项目对象", () => {
    const project = createEmptyProject("雨夜回响", "一段校园悬疑故事");

    expect(project.name).toBe("雨夜回响");
    expect(project.summary).toBe("一段校园悬疑故事");
    expect(project.routes).toHaveLength(1);
    expect(project.routes[0].routeType).toBe("common");
  });
});
