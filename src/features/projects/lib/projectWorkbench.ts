import type { Character } from "@/lib/domain/character";
import type { LoreEntry } from "@/lib/domain/lore";
import type { Project, Route } from "@/lib/domain/project";
import type { Scene } from "@/lib/domain/scene";
import type { ProjectVariable } from "@/lib/domain/variable";
import type { SceneLink } from "@/features/editor/store/linkUtils";
import { buildProjectStats, type ProjectStats } from "./projectStats";

export interface SummaryCard {
  label: string;
  value: string;
}

export interface TodoItem {
  label: string;
  value: number;
}

export interface RouteSummary {
  routeId: string;
  routeName: string;
  sceneCount: number;
}

export interface ProjectWorkbench {
  mergedScenes: Scene[];
  recentScene: Scene | null;
  startScene: Scene | null;
  recentRoute: Route | null;
  summaryCards: SummaryCard[];
  todoItems: TodoItem[];
  stats: ProjectStats;
  routeSummaries: RouteSummary[];
}

interface BuildProjectWorkbenchInput {
  project: Project;
  editorScenes: Scene[];
  links: SceneLink[];
  variables: ProjectVariable[];
  characters: Character[];
  loreEntries: LoreEntry[];
  selectedSceneId: string | null;
}

export function mergeProjectAndEditorScenes(
  project: Project,
  editorScenes: Scene[],
): Scene[] {
  const mergedSceneMap = new Map(
    project.scenes.map((scene) => [scene.id, scene] as const),
  );
  for (const scene of editorScenes) {
    if (scene.projectId === project.id) {
      mergedSceneMap.set(scene.id, scene);
    }
  }

  return [...mergedSceneMap.values()].sort((left, right) => {
    if (left.sortOrder !== right.sortOrder) {
      return left.sortOrder - right.sortOrder;
    }

    return left.title.localeCompare(right.title, "zh-CN");
  });
}

export function resolveRecentScene(
  scenes: Scene[],
  selectedSceneId: string | null,
): Scene | null {
  if (selectedSceneId) {
    const matched = scenes.find((scene) => scene.id === selectedSceneId);
    if (matched) {
      return matched;
    }
  }

  return scenes[scenes.length - 1] ?? null;
}

/**
 * 选起始场景：
 * 1) 显式标记了 isStartScene 的优先；
 * 2) 否则取 sortOrder 最小的；
 * 3) 都没有时返回 null。
 *
 * 内部用 stable sort（按 sortOrder 升序）保证与未排序输入也能给出确定结果。
 */
export function resolveStartScene(scenes: Scene[]): Scene | null {
  const flagged = scenes.find((scene) => scene.isStartScene);
  if (flagged) {
    return flagged;
  }

  if (scenes.length === 0) {
    return null;
  }

  return [...scenes].sort(
    (left, right) => left.sortOrder - right.sortOrder,
  )[0]!;
}

export function buildTodoItems(scenes: Scene[]): TodoItem[] {
  return [
    {
      label: "待修改",
      value: scenes.filter((scene) => scene.status === "needs_revision").length,
    },
    {
      label: "待补充",
      value: scenes.filter((scene) => scene.status === "needs_supplement")
        .length,
    },
    {
      label: "待检查逻辑",
      value: scenes.filter((scene) => scene.status === "needs_logic_check")
        .length,
    },
  ];
}

export function buildRouteSummaries(
  routes: Route[],
  scenes: Scene[],
): RouteSummary[] {
  const sortedRoutes = [...routes].sort((left, right) => {
    if (left.sortOrder !== right.sortOrder) {
      return left.sortOrder - right.sortOrder;
    }

    return left.id.localeCompare(right.id);
  });

  return sortedRoutes.map((route) => ({
    routeId: route.id,
    routeName: route.name,
    sceneCount: scenes.filter((scene) => scene.routeId === route.id).length,
  }));
}

export function buildProjectWorkbench(
  input: BuildProjectWorkbenchInput,
): ProjectWorkbench {
  const mergedScenes = mergeProjectAndEditorScenes(
    input.project,
    input.editorScenes,
  );
  const recentScene = resolveRecentScene(mergedScenes, input.selectedSceneId);
  const startScene = resolveStartScene(mergedScenes);
  const todoItems = buildTodoItems(mergedScenes);
  const routeSummaries = buildRouteSummaries(
    input.project.routes,
    mergedScenes,
  );
  const recentRoute =
    input.project.routes.find((route) => route.id === recentScene?.routeId) ??
    null;

  const stats = buildProjectStats({
    project: input.project,
    editorScenes: input.editorScenes,
    links: input.links,
    variables: input.variables,
    characters: input.characters,
    loreEntries: input.loreEntries,
  });

  const summaryCards: SummaryCard[] = [
    { label: "路线数", value: String(input.project.routes.length) },
    { label: "场景总数", value: String(mergedScenes.length) },
    {
      label: "待修改",
      value: String(
        mergedScenes.filter((scene) => scene.status === "needs_revision")
          .length,
      ),
    },
    {
      label: "待检查逻辑",
      value: String(
        mergedScenes.filter((scene) => scene.status === "needs_logic_check")
          .length,
      ),
    },
  ];

  return {
    mergedScenes,
    recentScene,
    startScene,
    recentRoute,
    summaryCards,
    todoItems,
    stats,
    routeSummaries,
  };
}
