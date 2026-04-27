import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SceneBlock } from "@/lib/domain/block";
import type { SceneLink } from "@/lib/domain/link";
import type { Scene } from "@/lib/domain/scene";
import {
  resetStoryRepositoryForTesting,
  setStoryRepositoryForTesting,
} from "@/lib/repositories/storyRepositoryRuntime";
import { useAutoSaveStore } from "@/lib/store/useAutoSaveStore";
import { useEditorStore } from "./useEditorStore";

function createScene(overrides: Partial<Scene> = {}): Scene {
  return {
    id: "scene-1",
    projectId: "p1",
    routeId: "route-1",
    title: "旧校舍入口",
    summary: "",
    sceneType: "normal",
    status: "draft",
    chapterLabel: "",
    sortOrder: 0,
    isStartScene: true,
    isEndingScene: false,
    notes: "",
    blocks: [],
    ...overrides,
  };
}

function createBlock(overrides: Partial<SceneBlock> = {}): SceneBlock {
  return {
    id: "block-1",
    sceneId: "scene-1",
    blockType: "narration",
    sortOrder: 0,
    characterId: null,
    contentText: "雨夜里传来脚步声。",
    metaJson: null,
    ...overrides,
  };
}

function createLink(overrides: Partial<SceneLink> = {}): SceneLink {
  return {
    id: "link-1",
    projectId: "p1",
    fromSceneId: "scene-1",
    toSceneId: "scene-2",
    linkType: "choice",
    sourceBlockId: "choice-block",
    label: "去旧校舍",
    conditionId: null,
    priorityOrder: 0,
    ...overrides,
  };
}

function createFakeStoryRepository(
  initialScenes: Scene[] = [],
  initialLinks: SceneLink[] = [],
) {
  const scenes = new Map(initialScenes.map((scene) => [scene.id, scene]));
  const links = new Map(initialLinks.map((link) => [link.id, link]));
  const listScenes = vi.fn(async (projectId: string) =>
    [...scenes.values()].filter((scene) => scene.projectId === projectId),
  );
  const listLinks = vi.fn(async (projectId: string) =>
    [...links.values()].filter((link) => link.projectId === projectId),
  );
  const updateScene = vi.fn(async (scene: Scene) => {
    scenes.set(scene.id, scene);
  });
  const saveBlocks = vi.fn(async (sceneId: string, blocks: SceneBlock[]) => {
    const scene = scenes.get(sceneId);
    if (!scene) {
      return;
    }

    scenes.set(sceneId, {
      ...scene,
      blocks,
    });
  });
  const saveLinks = vi.fn(async (projectId: string, nextLinks: SceneLink[]) => {
    for (const link of [...links.values()]) {
      if (link.projectId === projectId) {
        links.delete(link.id);
      }
    }

    for (const link of nextLinks) {
      links.set(link.id, link);
    }
  });

  return {
    repository: {
      listScenes,
      createScene: vi.fn(async () => createScene()),
      updateScene,
      deleteScene: vi.fn(async () => undefined),
      saveBlocks,
      listLinks,
      saveLinks,
    },
    listScenes,
    listLinks,
    updateScene,
    saveBlocks,
    saveLinks,
  };
}

describe("useEditorStore scenes repository", () => {
  beforeEach(() => {
    localStorage.clear();
    useEditorStore.getState().resetEditor();
    useAutoSaveStore.getState().reset();
    resetStoryRepositoryForTesting();
  });

  it("hydrateScenes 会从 repository 恢复当前项目场景和块", async () => {
    const scene = createScene({ blocks: [createBlock()] });
    const link = createLink();
    const fake = createFakeStoryRepository([scene], [link]);
    setStoryRepositoryForTesting(fake.repository);

    await useEditorStore.getState().hydrateScenes("p1");

    expect(fake.listScenes).toHaveBeenCalledWith("p1");
    expect(fake.listLinks).toHaveBeenCalledWith("p1");
    expect(useEditorStore.getState().scenes).toEqual([scene]);
    expect(useEditorStore.getState().links).toEqual([link]);
    expect(useEditorStore.getState().selectedSceneId).toBe(scene.id);
    expect(useAutoSaveStore.getState().hasRestoredDraft).toBe(true);
  });

  it("updateScene 会保存场景快照到 repository", () => {
    const scene = createScene();
    const fake = createFakeStoryRepository([scene]);
    setStoryRepositoryForTesting(fake.repository);
    useEditorStore.setState({ scenes: [scene], selectedSceneId: scene.id });

    useEditorStore.getState().updateScene(scene.id, {
      title: "第一章：回到旧校舍",
      status: "completed",
    });

    expect(fake.updateScene).toHaveBeenCalledWith(
      expect.objectContaining({
        id: scene.id,
        title: "第一章：回到旧校舍",
        status: "completed",
      }),
    );
  });

  it("块级新增、编辑、移动、删除会保存当前场景块快照", () => {
    const scene = createScene();
    const fake = createFakeStoryRepository([scene]);
    setStoryRepositoryForTesting(fake.repository);
    useEditorStore.setState({ scenes: [scene], selectedSceneId: scene.id });

    useEditorStore.getState().addBlock("narration");
    const firstBlockId =
      useEditorStore.getState().scenes[0]?.blocks[0]?.id ?? "";
    useEditorStore
      .getState()
      .updateBlockContent(scene.id, firstBlockId, "雨夜里传来脚步声。");
    useEditorStore.getState().addBlock("note");
    useEditorStore.getState().moveBlockDown(scene.id, firstBlockId);
    useEditorStore.getState().deleteBlock(scene.id, firstBlockId);

    expect(fake.saveBlocks).toHaveBeenCalled();
    expect(fake.saveBlocks).toHaveBeenLastCalledWith(
      scene.id,
      expect.arrayContaining([
        expect.objectContaining({
          blockType: "note",
          sortOrder: 0,
        }),
      ]),
    );
  });

  it("选项块和条件块更新会保存 metaJson 快照", () => {
    const scene = createScene();
    const fake = createFakeStoryRepository([scene]);
    setStoryRepositoryForTesting(fake.repository);
    useEditorStore.setState({ scenes: [scene], selectedSceneId: scene.id });

    useEditorStore.getState().addBlock("choice");
    const choiceBlockId =
      useEditorStore.getState().scenes[0]?.blocks[0]?.id ?? "";
    useEditorStore.getState().updateChoiceBlock(scene.id, choiceBlockId, {
      label: "拿起钥匙",
      targetSceneId: null,
      effectVariableId: null,
      effectValue: 0,
    });
    useEditorStore.getState().addBlock("condition");
    const conditionBlockId =
      useEditorStore.getState().scenes[0]?.blocks[1]?.id ?? "";
    useEditorStore.getState().updateConditionBlock(scene.id, conditionBlockId, {
      conditions: [
        {
          variableId: null,
          operator: "isTrue",
          compareValue: 1,
        },
      ],
    });

    expect(fake.saveBlocks).toHaveBeenLastCalledWith(
      scene.id,
      expect.arrayContaining([
        expect.objectContaining({
          metaJson: expect.stringContaining("conditions"),
        }),
      ]),
    );
  });

  it("updateChoiceBlock 和 deleteBlock 会保存当前项目 links 快照", () => {
    const targetScene = createScene({
      id: "scene-2",
      sortOrder: 1,
      isStartScene: false,
    });
    const scene = createScene({
      blocks: [createBlock({ id: "choice-block", blockType: "choice" })],
    });
    const fake = createFakeStoryRepository([scene, targetScene]);
    setStoryRepositoryForTesting(fake.repository);
    useEditorStore.setState({
      scenes: [scene, targetScene],
      selectedSceneId: scene.id,
    });

    useEditorStore.getState().updateChoiceBlock(scene.id, "choice-block", {
      label: "去旧校舍",
      targetSceneId: targetScene.id,
      effectVariableId: null,
      effectValue: 0,
    });

    expect(fake.saveLinks).toHaveBeenLastCalledWith(
      "p1",
      expect.arrayContaining([
        expect.objectContaining({
          fromSceneId: scene.id,
          toSceneId: targetScene.id,
          label: "去旧校舍",
        }),
      ]),
    );

    useEditorStore.getState().deleteBlock(scene.id, "choice-block");

    expect(fake.saveLinks).toHaveBeenLastCalledWith("p1", []);
  });
});
