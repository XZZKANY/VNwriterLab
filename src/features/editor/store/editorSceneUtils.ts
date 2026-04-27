import type { SceneBlock } from "@/lib/domain/block";
import type { Scene } from "@/lib/domain/scene";

export function normalizeEditorSceneBlocks(blocks: SceneBlock[]) {
  return blocks.map((block, index) => ({
    ...block,
    sortOrder: index,
  }));
}

export function sortEditorScenesByRouteAndOrder(scenes: Scene[]) {
  return [...scenes].sort((left, right) => {
    if (left.routeId !== right.routeId) {
      return left.routeId.localeCompare(right.routeId);
    }

    if (left.sortOrder !== right.sortOrder) {
      return left.sortOrder - right.sortOrder;
    }

    return left.id.localeCompare(right.id);
  });
}

export function normalizeEditorScenesByRoute(scenes: Scene[]) {
  const scenesByRoute = new Map<string, Scene[]>();

  for (const scene of scenes) {
    const currentScenes = scenesByRoute.get(scene.routeId) ?? [];
    currentScenes.push(scene);
    scenesByRoute.set(scene.routeId, currentScenes);
  }

  return [...scenesByRoute.entries()]
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
}
