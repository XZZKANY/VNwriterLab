import { create } from "zustand";
import { clearChoiceBlockTargetSceneId } from "../../editor/store/choiceBlock";
import {
  createEmptyProject,
  createRoute as createProjectRoute,
  createSceneInRoute as createProjectSceneInRoute,
  type Project,
  type ProjectTemplate,
} from "../../../lib/domain/project";
import type { Scene } from "../../../lib/domain/scene";
import { getProjectRepository } from "../../../lib/repositories/projectRepositoryRuntime";
import { getStoryRepository } from "../../../lib/repositories/storyRepositoryRuntime";
import { useAutoSaveStore } from "../../../lib/store/useAutoSaveStore";
import { useEditorStore } from "../../editor/store/useEditorStore";
import {
  moveProjectSceneToRoute,
  normalizeProjectScenesByRoute,
  sortProjectScenes,
  swapProjectScenePosition,
  syncEditorScenesFromProjectScenes,
} from "./projectSceneUtils";

interface ProjectState {
  currentProject: Project | null;
  hydrateLatestProject: () => Promise<void>;
  createProject: (
    name: string,
    summary: string,
    template?: ProjectTemplate,
  ) => void;
  createRoute: (name: string) => void;
  renameRoute: (routeId: string, name: string) => void;
  createSceneInRoute: (routeId: string) => Scene | null;
  updateScene: (
    sceneId: string,
    input: Partial<
      Pick<
        Scene,
        | "title"
        | "summary"
        | "sceneType"
        | "status"
        | "isStartScene"
        | "isEndingScene"
      >
    >,
  ) => void;
  deleteScene: (sceneId: string) => void;
  moveSceneUp: (sceneId: string) => void;
  moveSceneDown: (sceneId: string) => void;
  moveSceneToRoute: (sceneId: string, targetRouteId: string) => void;
  resetProject: () => void;
}

const initialState = {
  currentProject: null as Project | null,
};

function replaceEditorScenesFromProject(project: Project) {
  useEditorStore.setState({
    scenes: project.scenes,
    selectedSceneId: project.scenes[0]?.id ?? null,
    links: [],
    variables: [],
    selectedVariableId: null,
  });
}

function hydrateEditorStateFromProject(project: Project) {
  const currentEditorState = useEditorStore.getState();
  const syncedScenes =
    currentEditorState.scenes.length > 0
      ? syncEditorScenesFromProjectScenes(
          project.routes,
          project.scenes,
          currentEditorState.scenes,
        )
      : project.scenes;
  const nextScenes = syncedScenes.length > 0 ? syncedScenes : project.scenes;
  const nextSceneIds = new Set(nextScenes.map((scene) => scene.id));

  useEditorStore.setState({
    scenes: nextScenes,
    selectedSceneId:
      currentEditorState.selectedSceneId &&
      nextSceneIds.has(currentEditorState.selectedSceneId)
        ? currentEditorState.selectedSceneId
        : nextScenes[0]?.id ?? null,
    links: currentEditorState.links.filter(
      (link) =>
        nextSceneIds.has(link.fromSceneId) && nextSceneIds.has(link.toSceneId),
    ),
    variables: currentEditorState.variables.filter(
      (variable) => variable.projectId === project.id,
    ),
    selectedVariableId:
      currentEditorState.selectedVariableId &&
      currentEditorState.variables.some(
        (variable) =>
          variable.id === currentEditorState.selectedVariableId &&
          variable.projectId === project.id,
      )
        ? currentEditorState.selectedVariableId
        : null,
  });
}

function saveProjectSnapshot(project: Project) {
  return getProjectRepository().updateProject(project);
}

function saveStorySceneSnapshot(scene: Scene) {
  return getStoryRepository().updateScene(scene);
}

function deleteStorySceneSnapshot(sceneId: string) {
  return getStoryRepository().deleteScene(sceneId);
}

export const useProjectStore = create<ProjectState>()((set, get) => ({
  ...initialState,
  async hydrateLatestProject() {
    if (get().currentProject) {
      return;
    }

    const repository = getProjectRepository();
    const projects = await repository.listProjects();
    const latestProject = projects[0];

    if (!latestProject) {
      useAutoSaveStore.getState().markHydrated(false);
      return;
    }

    const hydratedProject =
      (await repository.getProject(latestProject.id)) ?? latestProject;

    set({
      currentProject: hydratedProject,
    });
    hydrateEditorStateFromProject(hydratedProject);
    useAutoSaveStore.getState().markHydrated(true);
  },
  createProject(name, summary, template) {
    useAutoSaveStore.getState().markDirty();

    const nextProject = createEmptyProject(name, summary, template);
    set({
      currentProject: nextProject,
    });
    replaceEditorScenesFromProject(nextProject);
    useAutoSaveStore.getState().markSaved();

    void getProjectRepository().createProject({
      name,
      summary,
      template,
      project: nextProject,
    });
  },
  createRoute(name) {
    const trimmedName = name.trim();
    const currentProject = get().currentProject;
    if (!currentProject || !trimmedName) {
      return;
    }

    useAutoSaveStore.getState().markDirty();

    const nextProject = {
      ...currentProject,
      routes: [
        ...currentProject.routes,
        createProjectRoute({
          projectId: currentProject.id,
          name: trimmedName,
          sortOrder: currentProject.routes.length,
        }),
      ],
    };

    set({
      currentProject: nextProject,
    });
    useAutoSaveStore.getState().markSaved();

    void saveProjectSnapshot(nextProject);
  },
  renameRoute(routeId, name) {
    const trimmedName = name.trim();
    const currentProject = get().currentProject;
    if (!currentProject || !trimmedName) {
      return;
    }

    const targetRoute = currentProject.routes.find((route) => route.id === routeId);
    if (!targetRoute || targetRoute.name === trimmedName) {
      return;
    }

    useAutoSaveStore.getState().markDirty();

    const nextProject = {
      ...currentProject,
      routes: currentProject.routes.map((route) =>
        route.id === routeId ? { ...route, name: trimmedName } : route,
      ),
    };

    set({
      currentProject: nextProject,
    });
    useAutoSaveStore.getState().markSaved();

    void saveProjectSnapshot(nextProject);
  },
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
  resetProject() {
    set(initialState);
  },
}));
