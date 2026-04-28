import type { Route } from "@/lib/domain/project";
import type { Scene } from "@/lib/domain/scene";
import type { SceneLink } from "@/features/editor/store/linkUtils";
import { buildOutlineView, type OutlineRouteSection } from "./outlineView";

export interface StatusCard {
  status: Scene["status"];
  label: string;
  scenes: Array<{ sceneId: string; title: string; routeName: string }>;
}

export interface RouteCard {
  routeId: string;
  routeName: string;
  sceneCount: number;
  scenes: Array<{ sceneId: string; title: string; sortOrder: number }>;
}

export interface ViewsDashboard {
  outlineSections: OutlineRouteSection[];
  statusCards: StatusCard[];
  routeCards: RouteCard[];
}

const STATUS_LABELS: Record<Scene["status"], string> = {
  draft: "草稿",
  completed: "已完成",
  needs_revision: "需修改",
  needs_supplement: "待补充",
  needs_logic_check: "待检查逻辑",
};

const STATUS_ORDER: Scene["status"][] = [
  "draft",
  "completed",
  "needs_revision",
  "needs_supplement",
  "needs_logic_check",
];

interface BuildViewsDashboardInput {
  routes: Route[];
  scenes: Scene[];
  links: SceneLink[];
}

export function buildStatusCards(
  routes: Route[],
  scenes: Scene[],
): StatusCard[] {
  const routeNameById = new Map(
    routes.map((route) => [route.id, route.name] as const),
  );

  return STATUS_ORDER.map((status) => ({
    status,
    label: STATUS_LABELS[status],
    scenes: scenes
      .filter((scene) => scene.status === status)
      .sort((left, right) => left.sortOrder - right.sortOrder)
      .map((scene) => ({
        sceneId: scene.id,
        title: scene.title,
        routeName: routeNameById.get(scene.routeId) ?? "未分配路线",
      })),
  }));
}

export function buildRouteCards(routes: Route[], scenes: Scene[]): RouteCard[] {
  return [...routes]
    .sort((left, right) => {
      if (left.sortOrder !== right.sortOrder) {
        return left.sortOrder - right.sortOrder;
      }

      return left.id.localeCompare(right.id);
    })
    .map((route) => {
      const routeScenes = scenes
        .filter((scene) => scene.routeId === route.id)
        .sort((left, right) => left.sortOrder - right.sortOrder);

      return {
        routeId: route.id,
        routeName: route.name,
        sceneCount: routeScenes.length,
        scenes: routeScenes.map((scene) => ({
          sceneId: scene.id,
          title: scene.title,
          sortOrder: scene.sortOrder,
        })),
      };
    });
}

export function buildViewsDashboard(
  input: BuildViewsDashboardInput,
): ViewsDashboard {
  return {
    outlineSections: buildOutlineView(input.routes, input.scenes, input.links),
    statusCards: buildStatusCards(input.routes, input.scenes),
    routeCards: buildRouteCards(input.routes, input.scenes),
  };
}
