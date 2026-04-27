import { describe, expect, it } from "vitest";
import type { SceneBlock } from "@/lib/domain/block";
import type { Scene } from "@/lib/domain/scene";
import {
  normalizeEditorSceneBlocks,
  normalizeEditorScenesByRoute,
  sortEditorScenesByRouteAndOrder,
} from "./editorSceneUtils";

function createBlock(id: string, sortOrder: number): SceneBlock {
  return {
    id,
    sceneId: "scene-1",
    blockType: "narration",
    sortOrder,
    characterId: null,
    contentText: id,
    metaJson: null,
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

describe("editorSceneUtils", () => {
  it("会重排块顺序", () => {
    const result = normalizeEditorSceneBlocks([
      createBlock("block-2", 3),
      createBlock("block-1", 9),
    ]);

    expect(
      result.map((block) => ({ id: block.id, sortOrder: block.sortOrder })),
    ).toEqual([
      { id: "block-2", sortOrder: 0 },
      { id: "block-1", sortOrder: 1 },
    ]);
  });

  it("会按 routeId 和 sortOrder 排序场景", () => {
    const result = sortEditorScenesByRouteAndOrder([
      createScene("scene-b-1", "route-b", 0),
      createScene("scene-a-2", "route-a", 1),
      createScene("scene-a-1", "route-a", 0),
    ]);

    expect(result.map((scene) => scene.id)).toEqual([
      "scene-a-1",
      "scene-a-2",
      "scene-b-1",
    ]);
  });

  it("会按路线分别重排场景并标记起始场景", () => {
    const result = normalizeEditorScenesByRoute([
      createScene("scene-b-2", "route-b", 5, { isStartScene: false }),
      createScene("scene-a-2", "route-a", 9, { isStartScene: false }),
      createScene("scene-a-1", "route-a", 3, { isStartScene: false }),
      createScene("scene-b-1", "route-b", 1, { isStartScene: false }),
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
      {
        id: "scene-a-2",
        routeId: "route-a",
        sortOrder: 1,
        isStartScene: false,
      },
      { id: "scene-b-1", routeId: "route-b", sortOrder: 0, isStartScene: true },
      {
        id: "scene-b-2",
        routeId: "route-b",
        sortOrder: 1,
        isStartScene: false,
      },
    ]);
  });
});
