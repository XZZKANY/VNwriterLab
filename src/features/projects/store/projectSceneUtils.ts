import type { Route } from "@/lib/domain/project";
import type { Scene } from "@/lib/domain/scene";

function createProjectSceneOrderComparator(routes: Route[]) {
  const routeOrderById = new Map(
    routes.map((route) => [route.id, route.sortOrder]),
  );

  return (left: Scene, right: Scene) => {
    const leftRouteOrder =
      routeOrderById.get(left.routeId) ?? Number.MAX_SAFE_INTEGER;
    const rightRouteOrder =
      routeOrderById.get(right.routeId) ?? Number.MAX_SAFE_INTEGER;

    if (leftRouteOrder !== rightRouteOrder) {
      return leftRouteOrder - rightRouteOrder;
    }

    if (left.sortOrder !== right.sortOrder) {
      return left.sortOrder - right.sortOrder;
    }

    return left.id.localeCompare(right.id);
  };
}

export function sortProjectScenes(routes: Route[], scenes: Scene[]) {
  return [...scenes].sort(createProjectSceneOrderComparator(routes));
}

export function normalizeProjectScenesByRoute(
  routes: Route[],
  scenes: Scene[],
) {
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
    .sort(([leftRouteId], [rightRouteId]) =>
      leftRouteId.localeCompare(rightRouteId),
    )
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

  return sortProjectScenes(routes, [
    ...knownRouteScenes,
    ...unknownRouteScenes,
  ]);
}

export function swapProjectScenePosition(
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

export function moveProjectSceneToRoute(
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

export function syncEditorScenesFromProjectScenes(
  routes: Route[],
  projectScenes: Scene[],
  currentEditorScenes: Scene[],
) {
  const projectSceneById = new Map(
    projectScenes.map((scene) => [scene.id, scene]),
  );

  return sortProjectScenes(
    routes,
    currentEditorScenes
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
      }),
  );
}
