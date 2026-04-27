import type { Project, Route } from "@/lib/domain/project";
import type { Scene } from "@/lib/domain/scene";

export interface CharacterRouteSummary {
  title: string;
  description: string;
  scenes: Scene[];
}

export interface CharacterSceneReference {
  scene: Scene;
  blockCount: number;
  isFirstAppearance: boolean;
}

/**
 * 给定项目与角色当前关联的 routeId，返回该路线的标题、描述与排序后的场景列表。
 * routeId 为空时返回 null（页面层应展示"未关联路线"提示）。
 */
export function getCharacterRouteSummary(
  currentProject: Project,
  routeId: string | null,
): CharacterRouteSummary | null {
  if (!routeId) {
    return null;
  }

  const route = currentProject.routes.find((item) => item.id === routeId);
  if (!route) {
    return {
      title: "未找到关联路线",
      description: "当前角色关联的路线已不存在。",
      scenes: [],
    };
  }

  const scenes = currentProject.scenes
    .filter((scene) => scene.routeId === route.id)
    .sort((left, right) => left.sortOrder - right.sortOrder);

  return {
    title: route.name,
    description: route.description,
    scenes,
  };
}

/**
 * 在所有 editor 场景里统计指定角色被引用的次数，并按引用次数降序、同次数按场景顺序返回。
 * 同时为首次出场（按路线顺序、场景排序、ID 顺序的组合最小者）的场景标记 isFirstAppearance。
 */
export function getCharacterSceneReferences(
  routes: Route[],
  editorScenes: Scene[],
  characterId: string,
): CharacterSceneReference[] {
  const routeOrderById = new Map(
    routes.map((route) => [route.id, route.sortOrder] as const),
  );

  const sceneReferences = editorScenes
    .map((scene) => {
      const blockCount = scene.blocks.filter(
        (block) => block.characterId === characterId,
      ).length;

      return blockCount > 0 ? { scene, blockCount } : null;
    })
    .filter(
      (
        item,
      ): item is {
        scene: Scene;
        blockCount: number;
      } => item !== null,
    );

  const firstAppearanceSceneId =
    [...sceneReferences].sort((left, right) => {
      const leftRouteOrder =
        routeOrderById.get(left.scene.routeId) ?? Number.MAX_SAFE_INTEGER;
      const rightRouteOrder =
        routeOrderById.get(right.scene.routeId) ?? Number.MAX_SAFE_INTEGER;

      if (leftRouteOrder !== rightRouteOrder) {
        return leftRouteOrder - rightRouteOrder;
      }

      if (left.scene.sortOrder !== right.scene.sortOrder) {
        return left.scene.sortOrder - right.scene.sortOrder;
      }

      return left.scene.id.localeCompare(right.scene.id);
    })[0]?.scene.id ?? null;

  return sceneReferences
    .map(({ scene, blockCount }) => ({
      scene,
      blockCount,
      isFirstAppearance: scene.id === firstAppearanceSceneId,
    }))
    .sort((left, right) => {
      if (left.blockCount === right.blockCount) {
        return left.scene.sortOrder - right.scene.sortOrder;
      }

      return right.blockCount - left.blockCount;
    });
}
