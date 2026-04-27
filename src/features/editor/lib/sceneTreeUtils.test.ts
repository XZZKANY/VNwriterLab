import { describe, expect, it } from "vitest";
import type { Route } from "@/lib/domain/project";
import type { Scene } from "@/lib/domain/scene";
import { buildRouteGroups, sortByRouteAndSceneOrder } from "./sceneTreeUtils";

function makeRoute(overrides: Partial<Route> = {}): Route {
  return {
    id: "route-1",
    projectId: "p1",
    name: "主线",
    routeType: "common",
    description: "",
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

describe("sortByRouteAndSceneOrder", () => {
  it("按 routeId 升序、sortOrder 升序、id 升序排序", () => {
    const a = makeScene({ id: "a", routeId: "r2", sortOrder: 0 });
    const b = makeScene({ id: "b", routeId: "r1", sortOrder: 5 });
    const c = makeScene({ id: "c", routeId: "r1", sortOrder: 5 });

    const sorted = [a, b, c].sort(sortByRouteAndSceneOrder);
    expect(sorted.map((scene) => scene.id)).toEqual(["b", "c", "a"]);
  });

  it("同一 route 内按 sortOrder 升序", () => {
    const a = makeScene({ id: "a", routeId: "r1", sortOrder: 2 });
    const b = makeScene({ id: "b", routeId: "r1", sortOrder: 0 });
    const c = makeScene({ id: "c", routeId: "r1", sortOrder: 1 });

    const sorted = [a, b, c].sort(sortByRouteAndSceneOrder);
    expect(sorted.map((scene) => scene.id)).toEqual(["b", "c", "a"]);
  });
});

describe("buildRouteGroups", () => {
  it("按 route.sortOrder 排序，每组按场景 sortOrder 升序", () => {
    const routes = [
      makeRoute({ id: "r2", name: "次线", sortOrder: 1 }),
      makeRoute({ id: "r1", name: "主线", sortOrder: 0 }),
    ];
    const scenes = [
      makeScene({ id: "s2", routeId: "r2", sortOrder: 0 }),
      makeScene({ id: "s1b", routeId: "r1", sortOrder: 1 }),
      makeScene({ id: "s1a", routeId: "r1", sortOrder: 0 }),
      makeScene({ id: "ghost", routeId: "missing", sortOrder: 0 }),
    ];

    const groups = buildRouteGroups(routes, scenes);

    expect(groups.map((group) => group.route.id)).toEqual(["r1", "r2"]);
    expect(groups[0]?.scenes.map((scene) => scene.id)).toEqual(["s1a", "s1b"]);
    expect(groups[1]?.scenes.map((scene) => scene.id)).toEqual(["s2"]);
  });

  it("没有路线时返回空数组", () => {
    expect(buildRouteGroups([], [makeScene()])).toEqual([]);
  });

  it("路线下没有场景时该组的 scenes 为空数组", () => {
    const routes = [makeRoute({ id: "lonely", sortOrder: 0 })];
    const groups = buildRouteGroups(routes, [
      makeScene({ id: "x", routeId: "other" }),
    ]);

    expect(groups).toHaveLength(1);
    expect(groups[0]?.scenes).toEqual([]);
  });
});
