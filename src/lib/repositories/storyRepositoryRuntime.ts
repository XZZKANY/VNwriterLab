import type { SceneBlock } from "../domain/block";
import type { SceneLink } from "../domain/link";
import { createSceneInRoute } from "../domain/project";
import type { Scene } from "../domain/scene";
import type { StoryRepository } from "./storyRepository";
import { createSqliteStoryRepository } from "./sqliteStoryRepository";

function createVolatileStoryRepository(): StoryRepository {
  const scenes = new Map<string, Scene>();
  const links = new Map<string, SceneLink>();

  function sortScenes(items: Scene[]) {
    return [...items].sort((left, right) => {
      const routeOrder = left.routeId.localeCompare(right.routeId);
      if (routeOrder !== 0) {
        return routeOrder;
      }

      const sortOrder = left.sortOrder - right.sortOrder;
      if (sortOrder !== 0) {
        return sortOrder;
      }

      return left.id.localeCompare(right.id);
    });
  }

  function normalizeBlocks(blocks: SceneBlock[]) {
    return [...blocks].sort((left, right) => {
      const sortOrder = left.sortOrder - right.sortOrder;
      if (sortOrder !== 0) {
        return sortOrder;
      }

      return left.id.localeCompare(right.id);
    });
  }

  return {
    async listScenes(projectId) {
      return sortScenes(
        [...scenes.values()]
          .filter((scene) => scene.projectId === projectId)
          .map((scene) => ({
            ...scene,
            blocks: normalizeBlocks(scene.blocks),
          })),
      );
    },
    async createScene(input) {
      const nextScene =
        input.scene ??
        (() => {
          const routeSceneCount = [...scenes.values()].filter(
            (scene) => scene.routeId === input.routeId,
          ).length;
          const baseScene = createSceneInRoute({
            projectId: input.projectId,
            routeId: input.routeId,
            sortOrder: routeSceneCount,
          });

          return {
            ...baseScene,
            title: input.title.trim() || baseScene.title,
            chapterLabel: input.chapterLabel,
          };
        })();

      scenes.set(nextScene.id, nextScene);
      return nextScene;
    },
    async updateScene(scene) {
      scenes.set(scene.id, {
        ...scene,
        blocks: scenes.get(scene.id)?.blocks ?? scene.blocks,
      });
    },
    async deleteScene(sceneId) {
      scenes.delete(sceneId);
      for (const link of [...links.values()]) {
        if (link.fromSceneId === sceneId || link.toSceneId === sceneId) {
          links.delete(link.id);
        }
      }
    },
    async saveBlocks(sceneId, blocks) {
      const scene = scenes.get(sceneId);
      if (!scene) {
        return;
      }

      scenes.set(sceneId, {
        ...scene,
        blocks: normalizeBlocks(blocks),
      });
    },
    async listLinks(projectId) {
      return [...links.values()]
        .filter((link) => link.projectId === projectId)
        .sort((left, right) => {
          const priorityOrder = left.priorityOrder - right.priorityOrder;
          if (priorityOrder !== 0) {
            return priorityOrder;
          }

          return left.id.localeCompare(right.id);
        });
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

let storyRepositoryOverride: StoryRepository | null = null;
let storyRepositorySingleton: StoryRepository | null = null;

function canUseSqliteRuntime() {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

export function getStoryRepository() {
  if (storyRepositoryOverride) {
    return storyRepositoryOverride;
  }

  if (!storyRepositorySingleton) {
    storyRepositorySingleton = canUseSqliteRuntime()
      ? createSqliteStoryRepository()
      : createVolatileStoryRepository();
  }

  return storyRepositorySingleton;
}

export function setStoryRepositoryForTesting(repository: StoryRepository) {
  storyRepositoryOverride = repository;
}

export function resetStoryRepositoryForTesting() {
  storyRepositoryOverride = null;
  storyRepositorySingleton = null;
}
