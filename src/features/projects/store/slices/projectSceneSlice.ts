import { createSceneInRoute as createProjectSceneInRoute } from "@/lib/domain/project";
import type { Project } from "@/lib/domain/project";
import type { Scene } from "@/lib/domain/scene";
import { getProjectRepository } from "@/lib/repositories/projectRepositoryRuntime";
import { getStoryRepository } from "@/lib/repositories/storyRepositoryRuntime";
import { useAutoSaveStore } from "@/lib/store/useAutoSaveStore";
import {
  readEditorSelectedSceneId,
  syncEditorAfterSceneDelete,
  syncEditorAfterSceneRearrangement,
  syncEditorAfterSceneUpdate,
} from "../editorSync";
import {
  moveProjectSceneToRoute,
  normalizeProjectScenesByRoute,
  sortProjectScenes,
  swapProjectScenePosition,
} from "../projectSceneUtils";
import type {
  ProjectSceneSlice,
  ProjectSliceCreator,
} from "../projectStore.types";

function saveProjectSnapshot(project: Project) {
  return getProjectRepository().updateProject(project);
}

function saveStorySceneSnapshot(scene: Scene) {
  return getStoryRepository().updateScene(scene);
}

function deleteStorySceneSnapshot(sceneId: string) {
  return getStoryRepository().deleteScene(sceneId);
}

export const createProjectSceneSlice: ProjectSliceCreator<ProjectSceneSlice> = (
  set,
  get,
) => {
  // 复用："收到候选场景列表 → 归一化 → 写项目状态 → 同步 editor → 落盘"五步流程
  function applyRearrangement(
    computeCandidate: (project: Project) => Scene[] | null,
  ): boolean {
    const currentProject = get().currentProject;
    if (!currentProject) {
      return false;
    }

    const candidate = computeCandidate(currentProject);
    if (!candidate) {
      return false;
    }

    useAutoSaveStore.getState().markDirty();

    const normalizedScenes = sortProjectScenes(
      currentProject.routes,
      candidate,
    );
    const nextProject = {
      ...currentProject,
      scenes: normalizedScenes,
    };

    set({
      currentProject: nextProject,
    });

    syncEditorAfterSceneRearrangement(currentProject.routes, normalizedScenes);

    useAutoSaveStore.getState().markSaved();

    void saveProjectSnapshot(nextProject);
    for (const scene of normalizedScenes) {
      void saveStorySceneSnapshot(scene);
    }

    return true;
  }

  return {
    createSceneInRoute(routeId) {
      const currentProject = get().currentProject;
      if (!currentProject) {
        return null;
      }

      const routeExists = currentProject.routes.some(
        (route) => route.id === routeId,
      );
      if (!routeExists) {
        return null;
      }

      useAutoSaveStore.getState().markDirty();

      const routeSceneCount = currentProject.scenes.filter(
        (scene) => scene.routeId === routeId,
      ).length;
      const nextScene = createProjectSceneInRoute({
        projectId: currentProject.id,
        routeId,
        sortOrder: routeSceneCount,
      });
      const nextProject = {
        ...currentProject,
        scenes: [...currentProject.scenes, nextScene],
      };

      set({
        currentProject: nextProject,
      });
      useAutoSaveStore.getState().markSaved();

      void saveProjectSnapshot(nextProject);
      void saveStorySceneSnapshot(nextScene);

      return nextScene;
    },
    updateScene(sceneId, input) {
      const currentProject = get().currentProject;
      if (!currentProject) {
        return;
      }

      const targetScene = currentProject.scenes.find(
        (scene) => scene.id === sceneId,
      );
      if (!targetScene) {
        return;
      }

      useAutoSaveStore.getState().markDirty();

      const nextScenes = sortProjectScenes(
        currentProject.routes,
        currentProject.scenes.map((scene) =>
          scene.id === sceneId ? { ...scene, ...input } : scene,
        ),
      );
      const nextProject = {
        ...currentProject,
        scenes: nextScenes,
      };

      set({
        currentProject: nextProject,
      });

      syncEditorAfterSceneUpdate(currentProject.routes, nextScenes);

      useAutoSaveStore.getState().markSaved();

      void saveProjectSnapshot(nextProject);
      const nextScene = nextScenes.find((scene) => scene.id === sceneId);
      if (nextScene) {
        void saveStorySceneSnapshot(nextScene);
      }
    },
    deleteScene(sceneId) {
      const currentProject = get().currentProject;
      if (!currentProject) {
        return;
      }

      const targetScene = currentProject.scenes.find(
        (scene) => scene.id === sceneId,
      );
      if (!targetScene) {
        return;
      }

      useAutoSaveStore.getState().markDirty();

      const orderedScenes = sortProjectScenes(
        currentProject.routes,
        currentProject.scenes,
      );
      const deletedIndex = orderedScenes.findIndex(
        (scene) => scene.id === sceneId,
      );
      const remainingScenes = orderedScenes.filter(
        (scene) => scene.id !== sceneId,
      );
      const normalizedScenes = normalizeProjectScenesByRoute(
        currentProject.routes,
        remainingScenes,
      );
      const nextProject = {
        ...currentProject,
        scenes: normalizedScenes,
      };
      const editorSelectedSceneId = readEditorSelectedSceneId();
      const nextSelectedSceneId =
        editorSelectedSceneId === sceneId
          ? (remainingScenes[deletedIndex]?.id ??
            remainingScenes[remainingScenes.length - 1]?.id ??
            null)
          : editorSelectedSceneId;

      set({
        currentProject: nextProject,
      });

      syncEditorAfterSceneDelete({
        routes: currentProject.routes,
        normalizedScenes,
        deletedSceneId: sceneId,
        nextSelectedSceneId,
      });

      useAutoSaveStore.getState().markSaved();

      void saveProjectSnapshot(nextProject);
      void deleteStorySceneSnapshot(sceneId);
    },
    moveSceneUp(sceneId) {
      applyRearrangement((project) =>
        swapProjectScenePosition(project.scenes, sceneId, -1),
      );
    },
    moveSceneDown(sceneId) {
      applyRearrangement((project) =>
        swapProjectScenePosition(project.scenes, sceneId, 1),
      );
    },
    moveSceneToRoute(sceneId, targetRouteId) {
      applyRearrangement((project) =>
        moveProjectSceneToRoute(
          project.scenes,
          project.routes,
          sceneId,
          targetRouteId,
        ),
      );
    },
  };
};
