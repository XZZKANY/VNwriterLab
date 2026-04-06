import { createEmptyProject } from "./project";

describe("createEmptyProject", () => {
  it("生成带默认共通线的空项目对象", () => {
    const project = createEmptyProject("雨夜回响", "一段校园悬疑故事");

    expect(project.name).toBe("雨夜回响");
    expect(project.summary).toBe("一段校园悬疑故事");
    expect(project.routes).toHaveLength(1);
    expect(project.routes[0].routeType).toBe("common");
  });

  it("支持创建线性短篇模板", () => {
    const project = createEmptyProject(
      "雨夜回响",
      "一段校园悬疑故事",
      "linear_short",
    );

    expect(project.projectType).toBe("linear");
    expect(project.routes).toHaveLength(1);
    expect(project.routes[0].name).toBe("主线");
    expect(project.scenes).toHaveLength(1);
    expect(project.scenes[0]).toEqual(
      expect.objectContaining({
        title: "开场",
        routeId: project.routes[0]?.id,
        isStartScene: true,
        isEndingScene: false,
      }),
    );
  });

  it("支持创建多结局模板", () => {
    const project = createEmptyProject(
      "雨夜回响",
      "一段校园悬疑故事",
      "multi_ending",
    );

    expect(project.projectType).toBe("multi_ending");
    expect(project.routes).toHaveLength(1);
    expect(project.routes[0].name).toBe("主线");
    expect(project.scenes).toHaveLength(3);
    expect(project.scenes.map((scene) => scene.title)).toEqual([
      "开场",
      "普通结局",
      "真结局",
    ]);
    expect(project.scenes.filter((scene) => scene.isEndingScene)).toHaveLength(2);
  });

  it("支持创建共通线加角色线模板", () => {
    const project = createEmptyProject(
      "雨夜回响",
      "一段校园悬疑故事",
      "route_character",
    );

    expect(project.projectType).toBe("route_based");
    expect(project.routes.map((route) => route.name)).toEqual([
      "共通线",
      "角色线 1",
      "角色线 2",
    ]);
    expect(project.routes.map((route) => route.routeType)).toEqual([
      "common",
      "character",
      "character",
    ]);
    expect(project.scenes).toHaveLength(3);
    expect(project.scenes.map((scene) => scene.title)).toEqual([
      "共通线开场",
      "角色线 1 开场",
      "角色线 2 开场",
    ]);
    expect(project.scenes.filter((scene) => scene.isStartScene)).toHaveLength(3);
  });
});
