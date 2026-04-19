import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { SceneBlock } from "../domain/block";
import type { SceneLink } from "../domain/link";
import type { Scene } from "../domain/scene";
import type { StoryRepository } from "./storyRepository";

vi.unmock("./sqliteStoryRepository");

function createScene(overrides: Partial<Scene> = {}): Scene {
  return {
    id: "scene-1",
    projectId: "project-1",
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
    projectId: "project-1",
    fromSceneId: "scene-1",
    toSceneId: "scene-2",
    linkType: "choice",
    sourceBlockId: "block-1",
    label: "去旧校舍",
    conditionId: null,
    priorityOrder: 0,
    ...overrides,
  };
}

function createFakeStoryRepository(): StoryRepository {
  const scenes = new Map<string, Scene>();
  const links = new Map<string, SceneLink>();

  return {
    async listScenes(projectId) {
      return [...scenes.values()].filter((scene) => scene.projectId === projectId);
    },
    async createScene(input) {
      const scene = createScene({
        id: "created-scene",
        projectId: input.projectId,
        routeId: input.routeId,
        title: input.title,
        chapterLabel: input.chapterLabel,
      });
      scenes.set(scene.id, scene);
      return scene;
    },
    async updateScene(scene) {
      scenes.set(scene.id, scene);
    },
    async deleteScene(sceneId) {
      scenes.delete(sceneId);
    },
    async saveBlocks(sceneId, blocks) {
      const scene = scenes.get(sceneId);
      if (!scene) {
        return;
      }

      scenes.set(sceneId, {
        ...scene,
        blocks,
      });
    },
    async listLinks(projectId) {
      return [...links.values()].filter((link) => link.projectId === projectId);
    },
    async saveLinks(projectId, nextLinks) {
      for (const link of [...links.values()]) {
        if (link.projectId === projectId) {
          links.delete(link.id);
        }
      }

      for (const link of nextLinks) {
        links.set(link.id, link);
      }
    },
  };
}

function setTauriInternals(value: unknown) {
  Object.defineProperty(window, "__TAURI_INTERNALS__", {
    configurable: true,
    value,
    writable: true,
  });
}

function clearTauriInternals() {
  if ("__TAURI_INTERNALS__" in window) {
    delete (window as Window & { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__;
  }
}

describe("storyRepositoryRuntime", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
    clearTauriInternals();
  });

  afterEach(() => {
    clearTauriInternals();
  });

  it("非 Tauri 环境会返回 volatile repository", async () => {
    const runtime = await import("./storyRepositoryRuntime");
    const repository = runtime.getStoryRepository();
    const scene = await repository.createScene({
      projectId: "project-1",
      routeId: "route-1",
      title: "旧校舍入口",
      chapterLabel: "第一章",
    });

    await repository.saveBlocks(scene.id, [createBlock({ sceneId: scene.id })]);
    await repository.updateScene({
      ...scene,
      title: "第一章：回到旧校舍",
    });

    await expect(repository.listScenes("project-1")).resolves.toMatchObject([
      {
        id: scene.id,
        title: "第一章：回到旧校舍",
        blocks: [{ contentText: "雨夜里传来脚步声。" }],
      },
    ]);

    await repository.deleteScene(scene.id);

    await expect(repository.listScenes("project-1")).resolves.toEqual([]);
  });

  it("createScene 支持保存既有 scene 元数据", async () => {
    const runtime = await import("./storyRepositoryRuntime");
    const repository = runtime.getStoryRepository();
    const scene = createScene({
      id: "existing-scene",
      title: "既有场景",
    });

    await repository.createScene({
      projectId: scene.projectId,
      routeId: scene.routeId,
      title: scene.title,
      chapterLabel: scene.chapterLabel,
      scene,
    });

    await expect(repository.listScenes(scene.projectId)).resolves.toEqual([scene]);
  });

  it("volatile repository 支持按项目保存和恢复 links", async () => {
    const runtime = await import("./storyRepositoryRuntime");
    const repository = runtime.getStoryRepository();
    const link = createLink();

    await repository.saveLinks("project-1", [link]);

    await expect(repository.listLinks("project-1")).resolves.toEqual([link]);
  });

  it("set/reset 会接管并恢复测试仓库", async () => {
    const runtime = await import("./storyRepositoryRuntime");
    const fakeRepository = createFakeStoryRepository();

    runtime.setStoryRepositoryForTesting(fakeRepository);
    expect(runtime.getStoryRepository()).toBe(fakeRepository);

    runtime.resetStoryRepositoryForTesting();
    expect(runtime.getStoryRepository()).not.toBe(fakeRepository);
  });

  it("Tauri 环境会选择 sqlite repository", async () => {
    const fakeRepository = createFakeStoryRepository();
    vi.doMock("./sqliteStoryRepository", () => ({
      createSqliteStoryRepository: vi.fn(() => fakeRepository),
    }));
    setTauriInternals({});

    const runtime = await import("./storyRepositoryRuntime");

    expect(runtime.getStoryRepository()).toBe(fakeRepository);
  });
});
