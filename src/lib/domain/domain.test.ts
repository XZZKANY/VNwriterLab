import { createEmptyCharacter } from "./character";
import { createEmptyLoreEntry } from "./lore";
import { createEmptyProject, createRoute, createSceneInRoute } from "./project";
import { createEmptyVariable } from "./variable";

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
    expect(project.scenes.filter((scene) => scene.isEndingScene)).toHaveLength(
      2,
    );
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
    expect(project.scenes.filter((scene) => scene.isStartScene)).toHaveLength(
      3,
    );
  });
});

describe("createRoute", () => {
  it("生成的 route 含 routeType=character 和默认描述", () => {
    const route = createRoute({
      projectId: "p1",
      name: "林夏线",
      sortOrder: 2,
    });

    expect(route.projectId).toBe("p1");
    expect(route.name).toBe("林夏线");
    expect(route.routeType).toBe("character");
    expect(route.description).toBe("林夏线的路线");
    expect(route.sortOrder).toBe(2);
    expect(route.id).toMatch(/[0-9a-f-]{36}/i);
  });

  it("两次调用 id 不同", () => {
    const a = createRoute({ projectId: "p", name: "A", sortOrder: 0 });
    const b = createRoute({ projectId: "p", name: "B", sortOrder: 1 });
    expect(a.id).not.toBe(b.id);
  });
});

describe("createSceneInRoute", () => {
  it("sortOrder=0 时 isStartScene 为 true", () => {
    const scene = createSceneInRoute({
      projectId: "p1",
      routeId: "r1",
      sortOrder: 0,
    });

    expect(scene.title).toBe("未命名场景 1");
    expect(scene.isStartScene).toBe(true);
    expect(scene.isEndingScene).toBe(false);
    expect(scene.sceneType).toBe("normal");
    expect(scene.status).toBe("draft");
    expect(scene.sortOrder).toBe(0);
    expect(scene.blocks).toEqual([]);
  });

  it("sortOrder>0 时 isStartScene 为 false 且标题序号递增", () => {
    const scene = createSceneInRoute({
      projectId: "p1",
      routeId: "r1",
      sortOrder: 4,
    });

    expect(scene.title).toBe("未命名场景 5");
    expect(scene.isStartScene).toBe(false);
    expect(scene.sortOrder).toBe(4);
  });
});

describe("createEmptyCharacter", () => {
  it("index=0 → 名字为'未命名角色 1'", () => {
    const character = createEmptyCharacter({ projectId: "p1", index: 0 });
    expect(character.name).toBe("未命名角色 1");
    expect(character.projectId).toBe("p1");
    expect(character.identity).toBe("");
    expect(character.routeId).toBeNull();
  });

  it("index 递增对应名字递增", () => {
    expect(createEmptyCharacter({ projectId: "p", index: 4 }).name).toBe(
      "未命名角色 5",
    );
  });
});

describe("createEmptyLoreEntry", () => {
  it("默认分类是 term，标签为空", () => {
    const entry = createEmptyLoreEntry({ projectId: "p1", index: 0 });
    expect(entry.name).toBe("未命名设定 1");
    expect(entry.category).toBe("term");
    expect(entry.tags).toEqual([]);
    expect(entry.description).toBe("");
  });
});

describe("createEmptyVariable", () => {
  it("默认是 flag 类型，初始值 0", () => {
    const variable = createEmptyVariable({ projectId: "p1", index: 0 });
    expect(variable.name).toBe("变量 1");
    expect(variable.variableType).toBe("flag");
    expect(variable.defaultValue).toBe(0);
  });

  it("不同 index 生成不同名字", () => {
    expect(createEmptyVariable({ projectId: "p", index: 9 }).name).toBe(
      "变量 10",
    );
  });
});
