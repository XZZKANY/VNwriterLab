import { describe, expect, it } from "vitest";
import type { Route } from "@/lib/domain/project";
import type { Scene } from "@/lib/domain/scene";
import type { SceneLink } from "@/features/editor/store/linkUtils";
import { buildOutlineView } from "./outlineView";

function makeRoute(overrides: Partial<Route> = {}): Route {
  return {
    id: "r1",
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
    id: "s1",
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

function makeLink(overrides: Partial<SceneLink> = {}): SceneLink {
  return {
    id: "l1",
    projectId: "p1",
    fromSceneId: "s1",
    toSceneId: "s2",
    linkType: "choice",
    sourceBlockId: null,
    label: "",
    conditionId: null,
    priorityOrder: 0,
    ...overrides,
  };
}

describe("buildOutlineView", () => {
  it("会按路线和场景顺序生成大纲结构并统计入出边", () => {
    const sections = buildOutlineView(
      [
        {
          id: "r1",
          projectId: "p1",
          name: "共通线",
          routeType: "common",
          description: "",
          sortOrder: 0,
        },
      ],
      [
        {
          id: "s1",
          projectId: "p1",
          routeId: "r1",
          title: "开场",
          summary: "",
          sceneType: "normal",
          status: "draft",
          chapterLabel: "",
          sortOrder: 0,
          isStartScene: true,
          isEndingScene: false,
          notes: "",
          blocks: [],
        },
        {
          id: "s2",
          projectId: "p1",
          routeId: "r1",
          title: "结尾",
          summary: "",
          sceneType: "ending",
          status: "draft",
          chapterLabel: "",
          sortOrder: 1,
          isStartScene: false,
          isEndingScene: true,
          notes: "",
          blocks: [],
        },
      ],
      [
        {
          id: "l1",
          projectId: "p1",
          fromSceneId: "s1",
          toSceneId: "s2",
          linkType: "choice",
          sourceBlockId: null,
          label: "继续",
          conditionId: null,
          priorityOrder: 0,
        },
      ],
    );

    expect(sections).toEqual([
      {
        routeId: "r1",
        routeName: "共通线",
        scenes: [
          expect.objectContaining({
            sceneId: "s1",
            incomingCount: 0,
            outgoingCount: 1,
          }),
          expect.objectContaining({
            sceneId: "s2",
            incomingCount: 1,
            outgoingCount: 0,
          }),
        ],
      },
    ]);
  });

  it("空 routes / scenes 时返回空数组", () => {
    expect(buildOutlineView([], [], [])).toEqual([]);
  });

  it("路线按 sortOrder 升序输出，与 routes 入参顺序无关", () => {
    const routes = [
      makeRoute({ id: "r2", name: "B", sortOrder: 1 }),
      makeRoute({ id: "r1", name: "A", sortOrder: 0 }),
    ];
    const sections = buildOutlineView(routes, [], []);
    expect(sections.map((section) => section.routeId)).toEqual(["r1", "r2"]);
  });

  it("场景按 sortOrder 升序，且与 scenes 入参顺序无关", () => {
    const routes = [makeRoute({ id: "ra" })];
    const scenes = [
      makeScene({ id: "s-a-2", routeId: "ra", sortOrder: 1 }),
      makeScene({ id: "s-a-1", routeId: "ra", sortOrder: 0 }),
    ];
    const sections = buildOutlineView(routes, scenes, []);
    expect(sections[0]?.scenes.map((scene) => scene.sceneId)).toEqual([
      "s-a-1",
      "s-a-2",
    ]);
  });

  it("不属于已知路线的场景被丢弃", () => {
    const routes = [makeRoute({ id: "r1" })];
    const scenes = [
      makeScene({ id: "s-known", routeId: "r1" }),
      makeScene({ id: "s-orphan", routeId: "ghost" }),
    ];

    const sections = buildOutlineView(routes, scenes, []);
    expect(sections).toHaveLength(1);
    expect(sections[0]?.scenes.map((scene) => scene.sceneId)).toEqual([
      "s-known",
    ]);
  });

  it("跨路线 link 各端点的 in/out count 都正确归位", () => {
    const routes = [
      makeRoute({ id: "ra", sortOrder: 0 }),
      makeRoute({ id: "rb", sortOrder: 1 }),
    ];
    const scenes = [
      makeScene({ id: "s-a", routeId: "ra" }),
      makeScene({ id: "s-b", routeId: "rb" }),
    ];
    const links = [makeLink({ fromSceneId: "s-a", toSceneId: "s-b" })];

    const sections = buildOutlineView(routes, scenes, links);
    expect(sections[0]?.scenes[0]).toMatchObject({
      sceneId: "s-a",
      outgoingCount: 1,
      incomingCount: 0,
    });
    expect(sections[1]?.scenes[0]).toMatchObject({
      sceneId: "s-b",
      outgoingCount: 0,
      incomingCount: 1,
    });
  });

  it("一个场景同时有多条入边与出边时计数正确", () => {
    const routes = [makeRoute()];
    const scenes = [
      makeScene({ id: "s1", sortOrder: 0 }),
      makeScene({ id: "s2", sortOrder: 1 }),
      makeScene({ id: "s3", sortOrder: 2 }),
    ];
    const links = [
      makeLink({ id: "l1", fromSceneId: "s1", toSceneId: "s2" }),
      makeLink({ id: "l2", fromSceneId: "s1", toSceneId: "s3" }),
      makeLink({ id: "l3", fromSceneId: "s2", toSceneId: "s3" }),
    ];

    const sections = buildOutlineView(routes, scenes, links);
    expect(sections[0]?.scenes[1]).toMatchObject({
      sceneId: "s2",
      incomingCount: 1,
      outgoingCount: 1,
    });
    expect(sections[0]?.scenes[2]).toMatchObject({
      sceneId: "s3",
      incomingCount: 2,
      outgoingCount: 0,
    });
  });

  it("透传 isStartScene / isEndingScene 标志", () => {
    const routes = [makeRoute()];
    const scenes = [
      makeScene({
        id: "s1",
        sortOrder: 0,
        isStartScene: true,
        isEndingScene: false,
      }),
      makeScene({
        id: "s2",
        sortOrder: 1,
        isStartScene: false,
        isEndingScene: true,
      }),
    ];

    const sections = buildOutlineView(routes, scenes, []);
    expect(sections[0]?.scenes[0]).toMatchObject({
      isStartScene: true,
      isEndingScene: false,
    });
    expect(sections[0]?.scenes[1]).toMatchObject({
      isStartScene: false,
      isEndingScene: true,
    });
  });
});
