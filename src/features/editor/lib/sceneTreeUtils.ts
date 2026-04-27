import type { Route } from "@/lib/domain/project";
import type { Scene } from "@/lib/domain/scene";

export interface SceneTreeRouteGroup {
  route: Route;
  scenes: Scene[];
}

export function sortByRouteAndSceneOrder(left: Scene, right: Scene): number {
  if (left.routeId !== right.routeId) {
    return left.routeId.localeCompare(right.routeId);
  }

  if (left.sortOrder !== right.sortOrder) {
    return left.sortOrder - right.sortOrder;
  }

  return left.id.localeCompare(right.id);
}

export function buildRouteGroups(
  routes: Route[],
  scenes: Scene[],
): SceneTreeRouteGroup[] {
  return [...routes]
    .sort((left, right) => left.sortOrder - right.sortOrder)
    .map((route) => ({
      route,
      scenes: scenes
        .filter((scene) => scene.routeId === route.id)
        .sort((left, right) => left.sortOrder - right.sortOrder),
    }));
}
