import { describe, expect, it } from "vitest";
import type { Route } from "@/lib/domain/project";
import type { Scene } from "@/lib/domain/scene";
import {
  buildRouteCards,
  buildStatusCards,
  buildViewsDashboard,
} from "./viewsDashboard";

function makeScene(overrides: Partial<Scene>): Scene {
  return {
    id: "scene-1",
    projectId: "p1",
    routeId: "r1",
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

const routes: Route[] = [
  {
    id: "r1",
    projectId: "p1",
    name: "主线",
    routeType: "common",
    description: "",
    sortOrder: 0,
  },
  {
    id: "r2",
    projectId: "p1",
    name: "支线",
    routeType: "character",
    description: "",
    sortOrder: 1,
  },
];

describe("viewsDashboard", () => {
  it("buildStatusCards 按预设 5 种状态分组并附带路线名", () => {
    const scenes = [
      makeScene({ id: "s1", routeId: "r1", status: "draft", sortOrder: 0 }),
      makeScene({
        id: "s2",
        routeId: "r1",
        status: "needs_revision",
        sortOrder: 1,
      }),
      makeScene({
        id: "s3",
        routeId: "r2",
        status: "completed",
        sortOrder: 0,
      }),
    ];

    const cards = buildStatusCards(routes, scenes);

    expect(cards.map((card) => card.status)).toEqual([
      "draft",
      "completed",
      "needs_revision",
      "needs_supplement",
      "needs_logic_check",
    ]);
    expect(cards[0].scenes).toEqual([
      { sceneId: "s1", title: "未命名场景", routeName: "主线" },
    ]);
    expect(cards[1].scenes).toEqual([
      { sceneId: "s3", title: "未命名场景", routeName: "支线" },
    ]);
    expect(cards[2].scenes).toEqual([
      { sceneId: "s2", title: "未命名场景", routeName: "主线" },
    ]);
  });

  it("buildRouteCards 按 sortOrder 排序，每张卡片含场景列表", () => {
    const scenes = [
      makeScene({ id: "s1", routeId: "r1", sortOrder: 1, title: "A1" }),
      makeScene({ id: "s2", routeId: "r1", sortOrder: 0, title: "A0" }),
      makeScene({ id: "s3", routeId: "r2", sortOrder: 0, title: "B0" }),
    ];

    const cards = buildRouteCards(routes, scenes);

    expect(cards.map((c) => c.routeId)).toEqual(["r1", "r2"]);
    expect(cards[0].sceneCount).toBe(2);
    expect(cards[0].scenes.map((s) => s.title)).toEqual(["A0", "A1"]);
    expect(cards[1].scenes.map((s) => s.title)).toEqual(["B0"]);
  });

  it("buildViewsDashboard 同时返回 outlineSections / statusCards / routeCards", () => {
    const scenes = [
      makeScene({ id: "s1", routeId: "r1", sortOrder: 0, status: "draft" }),
    ];

    const dashboard = buildViewsDashboard({
      routes,
      scenes,
      links: [],
    });

    expect(dashboard.outlineSections).toHaveLength(2);
    expect(dashboard.statusCards).toHaveLength(5);
    expect(dashboard.routeCards).toHaveLength(2);
  });
});
