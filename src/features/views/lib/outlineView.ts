import type { Route } from "@/lib/domain/project";
import type { Scene } from "@/lib/domain/scene";
import type { SceneLink } from "@/features/editor/store/linkUtils";

export interface OutlineSceneItem {
  sceneId: string;
  title: string;
  sortOrder: number;
  isStartScene: boolean;
  isEndingScene: boolean;
  incomingCount: number;
  outgoingCount: number;
}

export interface OutlineRouteSection {
  routeId: string;
  routeName: string;
  scenes: OutlineSceneItem[];
}

export function buildOutlineView(
  routes: Route[],
  scenes: Scene[],
  links: SceneLink[],
): OutlineRouteSection[] {
  return [...routes]
    .sort((left, right) => left.sortOrder - right.sortOrder)
    .map((route) => ({
      routeId: route.id,
      routeName: route.name,
      scenes: scenes
        .filter((scene) => scene.routeId === route.id)
        .sort((left, right) => left.sortOrder - right.sortOrder)
        .map((scene) => ({
          sceneId: scene.id,
          title: scene.title,
          sortOrder: scene.sortOrder,
          isStartScene: scene.isStartScene,
          isEndingScene: scene.isEndingScene,
          incomingCount: links.filter((link) => link.toSceneId === scene.id)
            .length,
          outgoingCount: links.filter((link) => link.fromSceneId === scene.id)
            .length,
        })),
    }));
}
