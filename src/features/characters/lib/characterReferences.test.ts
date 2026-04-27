import { describe, expect, it } from "vitest";
import type { Project, Route } from "@/lib/domain/project";
import type { Scene } from "@/lib/domain/scene";
import type { SceneBlock } from "@/lib/domain/block";
import {
  getCharacterRouteSummary,
  getCharacterSceneReferences,
} from "./characterReferences";

function makeRoute(overrides: Partial<Route> = {}): Route {
  return {
    id: "route-1",
    projectId: "p1",
    name: "主线",
    routeType: "common",
    description: "主线描述",
    sortOrder: 0,
    ...overrides,
  };
}

function makeScene(overrides: Partial<Scene> = {}): Scene {
  return {
    id: "scene-1",
    projectId: "p1",
    routeId: "route-1",
    title: "未命名场景",
    summary: "",
    sceneType: "normal",
    status: "draft",
    chapterLabel: "",
    sortOrder: 0,
    isStartScene: false,
    isEndingScene: false,
    notes: "",
    blocks: [],
    ...overrides,
  };
}

function makeBlock(overrides: Partial<SceneBlock> = {}): SceneBlock {
  return {
    id: "block-1",
    sceneId: "scene-1",
    blockType: "narration",
    sortOrder: 0,
    characterId: null,
    contentText: "",
    metaJson: null,
    ...overrides,
  };
}

function makeProject(overrides: Partial<Project> = {}): Project {
  return {
    id: "p1",
    name: "项目",
    summary: "",
    projectType: "route_based",
    routes: [],
    scenes: [],
    ...overrides,
  };
}

describe("getCharacterRouteSummary", () => {
  it("routeId 为 null 时返回 null", () => {
    const project = makeProject({ routes: [makeRoute()] });
    expect(getCharacterRouteSummary(project, null)).toBeNull();
  });

  it("routeId 不在项目中时返回兜底提示", () => {
    const project = makeProject({ routes: [makeRoute({ id: "exists" })] });
    const result = getCharacterRouteSummary(project, "missing");

    expect(result).toEqual({
      title: "未找到关联路线",
      description: "当前角色关联的路线已不存在。",
      scenes: [],
    });
  });

  it("命中路线时返回 title/description 和该路线的场景列表，按 sortOrder 升序", () => {
    const project = makeProject({
      routes: [
        makeRoute({ id: "r1", name: "共通线", description: "共通描述" }),
      ],
      scenes: [
        makeScene({ id: "s2", routeId: "r1", title: "二号", sortOrder: 1 }),
        makeScene({ id: "s1", routeId: "r1", title: "一号", sortOrder: 0 }),
        makeScene({ id: "x", routeId: "other", title: "外部", sortOrder: 0 }),
      ],
    });

    const result = getCharacterRouteSummary(project, "r1");

    expect(result).not.toBeNull();
    expect(result?.title).toBe("共通线");
    expect(result?.description).toBe("共通描述");
    expect(result?.scenes.map((scene) => scene.id)).toEqual(["s1", "s2"]);
  });
});

describe("getCharacterSceneReferences", () => {
  const characterId = "char-1";
  const otherCharacterId = "char-2";

  it("没有任何块引用该角色时返回空列表", () => {
    const result = getCharacterSceneReferences(
      [makeRoute()],
      [
        makeScene({
          id: "s1",
          blocks: [makeBlock({ characterId: otherCharacterId })],
        }),
      ],
      characterId,
    );

    expect(result).toEqual([]);
  });

  it("按引用次数降序、同次数按 sortOrder 升序返回", () => {
    const routes = [makeRoute({ id: "r1", sortOrder: 0 })];
    const scenes = [
      makeScene({
        id: "s1",
        routeId: "r1",
        sortOrder: 0,
        blocks: [
          makeBlock({ id: "b1", characterId }),
          makeBlock({ id: "b2", characterId }),
        ],
      }),
      makeScene({
        id: "s2",
        routeId: "r1",
        sortOrder: 1,
        blocks: [makeBlock({ id: "b3", characterId })],
      }),
      makeScene({
        id: "s3",
        routeId: "r1",
        sortOrder: 2,
        blocks: [makeBlock({ id: "b4", characterId })],
      }),
    ];

    const result = getCharacterSceneReferences(routes, scenes, characterId);

    expect(result.map((item) => item.scene.id)).toEqual(["s1", "s2", "s3"]);
    expect(result.map((item) => item.blockCount)).toEqual([2, 1, 1]);
  });

  it("以路线顺序、场景排序、id 综合最小者为首次出场", () => {
    const routes = [
      makeRoute({ id: "ra", sortOrder: 0 }),
      makeRoute({ id: "rb", sortOrder: 1 }),
    ];
    const scenes = [
      makeScene({
        id: "scene-rb-first",
        routeId: "rb",
        sortOrder: 0,
        blocks: [makeBlock({ characterId })],
      }),
      makeScene({
        id: "scene-ra-second",
        routeId: "ra",
        sortOrder: 1,
        blocks: [
          makeBlock({ id: "b-x", characterId }),
          makeBlock({ id: "b-y", characterId }),
        ],
      }),
      makeScene({
        id: "scene-ra-first",
        routeId: "ra",
        sortOrder: 0,
        blocks: [makeBlock({ characterId })],
      }),
    ];

    const result = getCharacterSceneReferences(routes, scenes, characterId);
    const first = result.find((item) => item.isFirstAppearance);

    // 路线 ra (sortOrder 0) 早于 rb；ra 内 sortOrder 0 的场景为首次
    expect(first?.scene.id).toBe("scene-ra-first");
    // 仅一个场景被标记为首次
    expect(result.filter((item) => item.isFirstAppearance)).toHaveLength(1);
  });

  it("路线列表里没有该 routeId 时仍能比较（fallback 到 MAX_SAFE_INTEGER）", () => {
    const routes: Route[] = [];
    const scenes = [
      makeScene({
        id: "s-late",
        routeId: "ghost",
        sortOrder: 5,
        blocks: [makeBlock({ characterId })],
      }),
      makeScene({
        id: "s-early",
        routeId: "ghost",
        sortOrder: 1,
        blocks: [makeBlock({ characterId })],
      }),
    ];

    const result = getCharacterSceneReferences(routes, scenes, characterId);
    const first = result.find((item) => item.isFirstAppearance);

    expect(first?.scene.id).toBe("s-early");
  });
});
