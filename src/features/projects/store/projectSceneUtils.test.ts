import { describe, expect, it } from "vitest";
import type { Route } from "../../../lib/domain/project";
import type { Scene } from "../../../lib/domain/scene";
import {
  moveProjectSceneToRoute,
  normalizeProjectScenesByRoute,
  sortProjectScenes,
  syncEditorScenesFromProjectScenes,
} from "./projectSceneUtils";

function createRoute(id: string, sortOrder: number): Route {
  return {
    id,
    projectId: "project-1",
    name: id,
    routeType: "common",
    description: "",
    sortOrder,
  };
}

function createScene(
  id: string,
  routeId: string,
  sortOrder: number,
  input?: Partial<Scene>,
): Scene {
  return {
    id,
    projectId: "project-1",
    routeId,
    title: id,
    summary: "",
    sceneType: "normal",
    status: "draft",
    chapterLabel: "",
    sortOrder,
    isStartScene: sortOrder === 0,
    isEndingScene: false,
    notes: "",
    blocks: [],
    ...input,
  };
}

describe("projectSceneUtils", () => {
  const routes = [createRoute("route-b", 1), createRoute("route-a", 0)];

  it("会按路线顺序和场景顺序排序项目场景", () => {
    const result = sortProjectScenes(routes, [
      createScene("scene-2", "route-b", 0),
      createScene("scene-1", "route-a", 1),
      createScene("scene-0", "route-a", 0),
    ]);

    expect(result.map((scene) => scene.id)).toEqual([
      "scene-0",
      "scene-1",
      "scene-2",
    ]);
  });

  it("归一化项目场景后会重排每条路线顺序并标记起始场景", () => {
    const result = normalizeProjectScenesByRoute(routes, [
      createScene("scene-a-2", "route-a", 9, { isStartScene: false }),
      createScene("scene-a-1", "route-a", 3, { isStartScene: false }),
      createScene("scene-b-1", "route-b", 4, { isStartScene: false }),
    ]);

    expect(
      result.map((scene) => ({
        id: scene.id,
        routeId: scene.routeId,
        sortOrder: scene.sortOrder,
        isStartScene: scene.isStartScene,
      })),
    ).toEqual([
      { id: "scene-a-1", routeId: "route-a", sortOrder: 0, isStartScene: true },
      { id: "scene-a-2", routeId: "route-a", sortOrder: 1, isStartScene: false },
      { id: "scene-b-1", routeId: "route-b", sortOrder: 0, isStartScene: true },
    ]);
  });

  it("跨路线移动场景后会同时重排源路线和目标路线", () => {
    const result = moveProjectSceneToRoute(
      [
        createScene("scene-a-1", "route-a", 0),
        createScene("scene-a-2", "route-a", 1),
        createScene("scene-b-1", "route-b", 0),
      ],
      routes,
      "scene-a-2",
      "route-b",
    );

    expect(result).not.toBeNull();
    expect(result!.map((scene) => ({
      id: scene.id,
      routeId: scene.routeId,
      sortOrder: scene.sortOrder,
      isStartScene: scene.isStartScene,
    }))).toEqual([
      { id: "scene-a-1", routeId: "route-a", sortOrder: 0, isStartScene: true },
      { id: "scene-a-2", routeId: "route-b", sortOrder: 1, isStartScene: false },
      { id: "scene-b-1", routeId: "route-b", sortOrder: 0, isStartScene: true },
    ]);
  });

  it("同步 editor 场景时会过滤不存在的场景并回填项目字段", () => {
    const result = syncEditorScenesFromProjectScenes(
      routes,
      [createScene("scene-a-1", "route-a", 0, { title: "新标题", status: "completed" })],
      [
        createScene("scene-a-1", "route-b", 9, { title: "旧标题", status: "draft" }),
        createScene("scene-stale", "route-a", 1),
      ],
    );

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: "scene-a-1",
      routeId: "route-a",
      sortOrder: 0,
      title: "新标题",
      status: "completed",
    });
  });
});
