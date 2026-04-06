import { create } from "zustand";
import { persist } from "zustand/middleware";
import { clearChoiceBlockTargetSceneId } from "../../editor/store/choiceBlock";
import {
  createEmptyProject,
  createRoute as createProjectRoute,
  createSceneInRoute as createProjectSceneInRoute,
  type Project,
  type Route,
} from "../../../lib/domain/project";
import type { Scene } from "../../../lib/domain/scene";
import { useEditorStore } from "../../editor/store/useEditorStore";
import { useAutoSaveStore } from "../../../lib/store/useAutoSaveStore";

interface ProjectState {
  currentProject: Project | null;
  createProject: (name: string, summary: string) => void;
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

export const PROJECT_STORAGE_KEY = "vn-writer-lab.project-store";

const initialState = {
  currentProject: null as Project | null,
};

function getSceneOrderComparator(routes: Route[]) {
  const routeOrderById = new Map(
    routes.map((route) => [route.id, route.sortOrder]),
  );

  return (left: Scene, right: Scene) => {
    const leftRouteOrder = routeOrderById.get(left.routeId) ?? Number.MAX_SAFE_INTEGER;
    const rightRouteOrder = routeOrderById.get(right.routeId) ?? Number.MAX_SAFE_INTEGER;

    if (leftRouteOrder !== rightRouteOrder) {
      return leftRouteOrder - rightRouteOrder;
    }

    if (left.sortOrder !== right.sortOrder) {
      return left.sortOrder - right.sortOrder;
    }

    return left.id.localeCompare(right.id);
  };
}

function normalizeScenesByRoute(routes: Route[], scenes: Scene[]) {
  const routeOrderById = new Map(
    routes.map((route) => [route.id, route.sortOrder]),
  );
  const groupedScenes = new Map<string, Scene[]>();

  for (const scene of scenes) {
    const currentScenes = groupedScenes.get(scene.routeId) ?? [];
    currentScenes.push(scene);
    groupedScenes.set(scene.routeId, currentScenes);
  }

  const knownRouteScenes = routes.flatMap((route) =>
    (groupedScenes.get(route.id) ?? [])
      .sort((left, right) => {
        if (left.sortOrder !== right.sortOrder) {
          return left.sortOrder - right.sortOrder;
        }

        return left.id.localeCompare(right.id);
      })
      .map((scene, index) => ({
        ...scene,
        sortOrder: index,
        isStartScene: index === 0,
      })),
  );

  const unknownRouteScenes = [...groupedScenes.entries()]
    .filter(([routeId]) => !routeOrderById.has(routeId))
    .sort(([leftRouteId], [rightRouteId]) => leftRouteId.localeCompare(rightRouteId))
    .flatMap(([, routeScenes]) =>
      routeScenes
        .sort((left, right) => {
          if (left.sortOrder !== right.sortOrder) {
            return left.sortOrder - right.sortOrder;
          }

          return left.id.localeCompare(right.id);
        })
        .map((scene, index) => ({
          ...scene,
          sortOrder: index,
          isStartScene: index === 0,
        })),
    );

  return [...knownRouteScenes, ...unknownRouteScenes].sort(
    getSceneOrderComparator(routes),
  );
}

function swapScenePosition(
  scenes: Scene[],
  sceneId: string,
  direction: -1 | 1,
) {
  const targetScene = scenes.find((scene) => scene.id === sceneId);
  if (!targetScene) {
    return null;
  }

  const routeScenes = scenes
    .filter((scene) => scene.routeId === targetScene.routeId)
    .sort((left, right) => {
      if (left.sortOrder !== right.sortOrder) {
        return left.sortOrder - right.sortOrder;
      }

      return left.id.localeCompare(right.id);
    });

  const currentIndex = routeScenes.findIndex((scene) => scene.id === sceneId);
  const nextIndex = currentIndex + direction;
  if (currentIndex < 0 || nextIndex < 0 || nextIndex >= routeScenes.length) {
    return null;
  }

  const nextRouteScenes = [...routeScenes];
  [nextRouteScenes[currentIndex], nextRouteScenes[nextIndex]] = [
    nextRouteScenes[nextIndex]!,
    nextRouteScenes[currentIndex]!,
  ];

  const nextScenesById = new Map<string, Scene>();

  nextRouteScenes.forEach((scene, index) => {
    nextScenesById.set(scene.id, {
      ...scene,
      sortOrder: index,
      isStartScene: index === 0,
    });
  });

  return scenes.map((scene) => nextScenesById.get(scene.id) ?? scene);
}

function moveSceneToRoute(
  scenes: Scene[],
  routes: Route[],
  sceneId: string,
  targetRouteId: string,
) {
  const targetScene = scenes.find((scene) => scene.id === sceneId);
  if (!targetScene || targetScene.routeId === targetRouteId) {
    return null;
  }

  const targetRouteExists = routes.some((route) => route.id === targetRouteId);
  if (!targetRouteExists) {
    return null;
  }

  const sourceRouteScenes = scenes
    .filter(
      (scene) => scene.routeId === targetScene.routeId && scene.id !== sceneId,
    )
    .sort((left, right) => {
      if (left.sortOrder !== right.sortOrder) {
        return left.sortOrder - right.sortOrder;
      }

      return left.id.localeCompare(right.id);
    });

  const targetRouteScenes = scenes
    .filter((scene) => scene.routeId === targetRouteId)
    .sort((left, right) => {
      if (left.sortOrder !== right.sortOrder) {
        return left.sortOrder - right.sortOrder;
      }

      return left.id.localeCompare(right.id);
    });

  const nextScenesById = new Map<string, Scene>();

  sourceRouteScenes.forEach((scene, index) => {
    nextScenesById.set(scene.id, {
      ...scene,
      sortOrder: index,
      isStartScene: index === 0,
    });
  });

  const movedScene = {
    ...targetScene,
    routeId: targetRouteId,
  };

  [...targetRouteScenes, movedScene].forEach((scene, index) => {
    nextScenesById.set(scene.id, {
      ...scene,
      routeId: scene.id === sceneId ? targetRouteId : scene.routeId,
      sortOrder: index,
      isStartScene: index === 0,
    });
  });

  return scenes.map((scene) => nextScenesById.get(scene.id) ?? scene);
}

function syncEditorScenes(
  routes: Route[],
  projectScenes: Scene[],
  currentEditorScenes: Scene[],
) {
  const projectSceneById = new Map(
    projectScenes.map((scene) => [scene.id, scene]),
  );

  return [...currentEditorScenes]
    .filter((scene) => projectSceneById.has(scene.id))
    .map((scene) => {
      const nextScene = projectSceneById.get(scene.id)!;

      return {
        ...scene,
        title: nextScene.title,
        summary: nextScene.summary,
        sceneType: nextScene.sceneType,
        status: nextScene.status,
        routeId: nextScene.routeId,
        sortOrder: nextScene.sortOrder,
        isStartScene: nextScene.isStartScene,
        isEndingScene: nextScene.isEndingScene,
      };
    })
    .sort(getSceneOrderComparator(routes));
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set, get) => ({
      ...initialState,
      createProject: (name, summary) => {
        useAutoSaveStore.getState().markDirty();

        set({
          currentProject: createEmptyProject(name, summary),
        });

        useAutoSaveStore.getState().markSaved();
      },
      createRoute: (name) => {
        const trimmedName = name.trim();
        const currentProject = get().currentProject;
        if (!currentProject || !trimmedName) {
          return;
        }

        useAutoSaveStore.getState().markDirty();

        set({
          currentProject: {
            ...currentProject,
            routes: [
              ...currentProject.routes,
              createProjectRoute({
                projectId: currentProject.id,
                name: trimmedName,
                sortOrder: currentProject.routes.length,
              }),
            ],
          },
        });

        useAutoSaveStore.getState().markSaved();
      },
      renameRoute: (routeId, name) => {
        const trimmedName = name.trim();
        const currentProject = get().currentProject;
        if (!currentProject || !trimmedName) {
          return;
        }

        const targetRoute = currentProject.routes.find(
          (route) => route.id === routeId,
        );
        if (!targetRoute || targetRoute.name === trimmedName) {
          return;
        }

        useAutoSaveStore.getState().markDirty();

        set({
          currentProject: {
            ...currentProject,
            routes: currentProject.routes.map((route) =>
              route.id === routeId ? { ...route, name: trimmedName } : route,
            ),
          },
        });

        useAutoSaveStore.getState().markSaved();
      },
      createSceneInRoute: (routeId) => {
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

        set({
          currentProject: {
            ...currentProject,
            scenes: [...currentProject.scenes, nextScene],
          },
        });

        useAutoSaveStore.getState().markSaved();

        return nextScene;
      },
      updateScene: (sceneId, input) => {
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

        const nextScenes = [...currentProject.scenes]
          .map((scene) =>
            scene.id === sceneId ? { ...scene, ...input } : scene,
          )
          .sort(getSceneOrderComparator(currentProject.routes));

        set({
          currentProject: {
            ...currentProject,
            scenes: nextScenes,
          },
        });

        useEditorStore.setState((state) => ({
          scenes: syncEditorScenes(
            currentProject.routes,
            nextScenes,
            state.scenes,
          ),
          selectedSceneId:
            state.selectedSceneId && !nextScenes.some((scene) => scene.id === state.selectedSceneId)
              ? nextScenes[0]?.id ?? null
              : state.selectedSceneId,
        }));

        useAutoSaveStore.getState().markSaved();
      },
      deleteScene: (sceneId) => {
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

        const orderedScenes = [...currentProject.scenes].sort(
          getSceneOrderComparator(currentProject.routes),
        );
        const deletedIndex = orderedScenes.findIndex((scene) => scene.id === sceneId);
        const remainingScenes = orderedScenes.filter((scene) => scene.id !== sceneId);
        const normalizedScenes = normalizeScenesByRoute(
          currentProject.routes,
          remainingScenes,
        );
        const currentEditorState = useEditorStore.getState();
        const nextSelectedSceneId =
          currentEditorState.selectedSceneId === sceneId
            ? remainingScenes[deletedIndex]?.id ??
              remainingScenes[remainingScenes.length - 1]?.id ??
              null
            : currentEditorState.selectedSceneId;

        set({
          currentProject: {
            ...currentProject,
            scenes: normalizedScenes,
          },
        });

        useEditorStore.setState({
          scenes: syncEditorScenes(
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
            (link) =>
              link.fromSceneId !== sceneId && link.toSceneId !== sceneId,
          ),
          selectedSceneId: nextSelectedSceneId,
        });

        useAutoSaveStore.getState().markSaved();
      },
      moveSceneUp: (sceneId) => {
        const currentProject = get().currentProject;
        if (!currentProject) {
          return;
        }

        const nextScenes = swapScenePosition(currentProject.scenes, sceneId, -1);
        if (!nextScenes) {
          return;
        }

        useAutoSaveStore.getState().markDirty();

        const normalizedScenes = [...nextScenes].sort(
          getSceneOrderComparator(currentProject.routes),
        );

        set({
          currentProject: {
            ...currentProject,
            scenes: normalizedScenes,
          },
        });

        useEditorStore.setState((state) => ({
          scenes: syncEditorScenes(
            currentProject.routes,
            normalizedScenes,
            state.scenes,
          ),
        }));

        useAutoSaveStore.getState().markSaved();
      },
      moveSceneDown: (sceneId) => {
        const currentProject = get().currentProject;
        if (!currentProject) {
          return;
        }

        const nextScenes = swapScenePosition(currentProject.scenes, sceneId, 1);
        if (!nextScenes) {
          return;
        }

        useAutoSaveStore.getState().markDirty();

        const normalizedScenes = [...nextScenes].sort(
          getSceneOrderComparator(currentProject.routes),
        );

        set({
          currentProject: {
            ...currentProject,
            scenes: normalizedScenes,
          },
        });

        useEditorStore.setState((state) => ({
          scenes: syncEditorScenes(
            currentProject.routes,
            normalizedScenes,
            state.scenes,
          ),
        }));

        useAutoSaveStore.getState().markSaved();
      },
      moveSceneToRoute: (sceneId, targetRouteId) => {
        const currentProject = get().currentProject;
        if (!currentProject) {
          return;
        }

        const nextScenes = moveSceneToRoute(
          currentProject.scenes,
          currentProject.routes,
          sceneId,
          targetRouteId,
        );
        if (!nextScenes) {
          return;
        }

        useAutoSaveStore.getState().markDirty();

        const normalizedScenes = [...nextScenes].sort(
          getSceneOrderComparator(currentProject.routes),
        );

        set({
          currentProject: {
            ...currentProject,
            scenes: normalizedScenes,
          },
        });

        useEditorStore.setState((state) => ({
          scenes: syncEditorScenes(
            currentProject.routes,
            normalizedScenes,
            state.scenes,
          ),
        }));

        useAutoSaveStore.getState().markSaved();
      },
      resetProject: () => set(initialState),
    }),
    {
      name: PROJECT_STORAGE_KEY,
      partialize: (state) => ({
        currentProject: state.currentProject,
      }),
      onRehydrateStorage: () => {
        const restored = localStorage.getItem(PROJECT_STORAGE_KEY) !== null;

        return () => {
          useAutoSaveStore.getState().markHydrated(restored);
        };
      },
    },
  ),
);
