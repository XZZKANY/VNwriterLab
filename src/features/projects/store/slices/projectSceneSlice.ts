import { clearChoiceBlockTargetSceneId } from "../../../editor/store/choiceBlock";
import { createSceneInRoute as createProjectSceneInRoute } from "../../../../lib/domain/project";
import type { Project } from "../../../../lib/domain/project";
import type { Scene } from "../../../../lib/domain/scene";
import { getProjectRepository } from "../../../../lib/repositories/projectRepositoryRuntime";
import { getStoryRepository } from "../../../../lib/repositories/storyRepositoryRuntime";
import { useAutoSaveStore } from "../../../../lib/store/useAutoSaveStore";
import { useEditorStore } from "../../../editor/store/useEditorStore";
import {
  moveProjectSceneToRoute,
  normalizeProjectScenesByRoute,
  sortProjectScenes,
  swapProjectScenePosition,
  syncEditorScenesFromProjectScenes,
} from "../projectSceneUtils";
import type { ProjectSceneSlice, ProjectSliceCreator } from "../projectStore.types";

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
) => ({
  createSceneInRoute(routeId) {
    const currentProject = get().currentProject;
    if (!currentProject) {
      return null;
    }

    const routeExists = currentProject.routes.some((route) => route.id === routeId);
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

    const targetScene = currentProject.scenes.find((scene) => scene.id === sceneId);
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

    useEditorStore.setState((state) => ({
      scenes: syncEditorScenesFromProjectScenes(
        currentProject.routes,
        nextScenes,
        state.scenes,
      ),
      selectedSceneId:
        state.selectedSceneId &&
        !nextScenes.some((scene) => scene.id === state.selectedSceneId)
          ? nextScenes[0]?.id ?? null
          : state.selectedSceneId,
    }));

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

    const targetScene = currentProject.scenes.find((scene) => scene.id === sceneId);
    if (!targetScene) {
      return;
    }

    useAutoSaveStore.getState().markDirty();

    const orderedScenes = sortProjectScenes(
      currentProject.routes,
      currentProject.scenes,
    );
    const deletedIndex = orderedScenes.findIndex((scene) => scene.id === sceneId);
    const remainingScenes = orderedScenes.filter((scene) => scene.id !== sceneId);
    const normalizedScenes = normalizeProjectScenesByRoute(
      currentProject.routes,
      remainingScenes,
    );
    const nextProject = {
      ...currentProject,
      scenes: normalizedScenes,
    };
    const currentEditorState = useEditorStore.getState();
    const nextSelectedSceneId =
      currentEditorState.selectedSceneId === sceneId
        ? remainingScenes[deletedIndex]?.id ??
          remainingScenes[remainingScenes.length - 1]?.id ??
          null
        : currentEditorState.selectedSceneId;

    set({
      currentProject: nextProject,
    });

    useEditorStore.setState({
      scenes: syncEditorScenesFromProjectScenes(
        currentProject.routes,
        normalizedScenes,
        currentEditorState.scenes,
      ).map((scene) => ({
        ...scene,
        blocks: scene.blocks.map((block) => {
          if (block.blockType !== "choice") {
            return block;
          }

          const nextMetaJson = clearChoiceBlockTargetSceneId(
            block.metaJson,
            sceneId,
          );
          if (nextMetaJson === block.metaJson) {
            return block;
          }

          return {
            ...block,
            metaJson: nextMetaJson,
          };
        }),
      })),
      links: currentEditorState.links.filter(
        (link) => link.fromSceneId !== sceneId && link.toSceneId !== sceneId,
      ),
      selectedSceneId: nextSelectedSceneId,
    });

    useAutoSaveStore.getState().markSaved();

    void saveProjectSnapshot(nextProject);
    void deleteStorySceneSnapshot(sceneId);
  },
  moveSceneUp(sceneId) {
    const currentProject = get().currentProject;
    if (!currentProject) {
      return;
    }

    const nextScenes = swapProjectScenePosition(
      currentProject.scenes,
      sceneId,
      -1,
    );
    if (!nextScenes) {
      return;
    }

    useAutoSaveStore.getState().markDirty();

    const normalizedScenes = sortProjectScenes(
      currentProject.routes,
      nextScenes,
    );
    const nextProject = {
      ...currentProject,
      scenes: normalizedScenes,
    };

    set({
      currentProject: nextProject,
    });

    useEditorStore.setState((state) => ({
      scenes: syncEditorScenesFromProjectScenes(
        currentProject.routes,
        normalizedScenes,
        state.scenes,
      ),
    }));

    useAutoSaveStore.getState().markSaved();

    void saveProjectSnapshot(nextProject);
    for (const scene of normalizedScenes) {
      void saveStorySceneSnapshot(scene);
    }
  },
  moveSceneDown(sceneId) {
    const currentProject = get().currentProject;
    if (!currentProject) {
      return;
    }

    const nextScenes = swapProjectScenePosition(
      currentProject.scenes,
      sceneId,
      1,
    );
    if (!nextScenes) {
      return;
    }

    useAutoSaveStore.getState().markDirty();

    const normalizedScenes = sortProjectScenes(
      currentProject.routes,
      nextScenes,
    );
    const nextProject = {
      ...currentProject,
      scenes: normalizedScenes,
    };

    set({
      currentProject: nextProject,
    });

    useEditorStore.setState((state) => ({
      scenes: syncEditorScenesFromProjectScenes(
        currentProject.routes,
        normalizedScenes,
        state.scenes,
      ),
    }));

    useAutoSaveStore.getState().markSaved();

    void saveProjectSnapshot(nextProject);
    for (const scene of normalizedScenes) {
      void saveStorySceneSnapshot(scene);
    }
  },
  moveSceneToRoute(sceneId, targetRouteId) {
    const currentProject = get().currentProject;
    if (!currentProject) {
      return;
    }

    const nextScenes = moveProjectSceneToRoute(
      currentProject.scenes,
      currentProject.routes,
      sceneId,
      targetRouteId,
    );
    if (!nextScenes) {
      return;
    }

    useAutoSaveStore.getState().markDirty();

    const normalizedScenes = sortProjectScenes(
      currentProject.routes,
      nextScenes,
    );
    const nextProject = {
      ...currentProject,
      scenes: normalizedScenes,
    };

    set({
      currentProject: nextProject,
    });

    useEditorStore.setState((state) => ({
      scenes: syncEditorScenesFromProjectScenes(
        currentProject.routes,
        normalizedScenes,
        state.scenes,
      ),
    }));

    useAutoSaveStore.getState().markSaved();

    void saveProjectSnapshot(nextProject);
    for (const scene of normalizedScenes) {
      void saveStorySceneSnapshot(scene);
    }
  },
});
