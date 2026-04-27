import type { Scene } from "@/lib/domain/scene";
import type { SceneLink } from "@/lib/domain/link";
import type { ProjectVariable } from "@/lib/domain/variable";
import { getReferenceRepository } from "@/lib/repositories/referenceRepositoryRuntime";
import { getStoryRepository } from "@/lib/repositories/storyRepositoryRuntime";

export function saveSceneSnapshot(sceneId: string, scenes: Scene[]): void {
  const scene = scenes.find((item) => item.id === sceneId);
  if (!scene) {
    return;
  }

  void getStoryRepository().updateScene(scene);
}

export function saveSceneBlocksSnapshot(
  sceneId: string,
  scenes: Scene[],
): void {
  const scene = scenes.find((item) => item.id === sceneId);
  if (!scene) {
    return;
  }

  void getStoryRepository().saveBlocks(sceneId, scene.blocks);
}

export function saveProjectLinksSnapshot(
  projectId: string,
  links: SceneLink[],
): void {
  const projectLinks = links.filter((link) => link.projectId === projectId);

  void getStoryRepository().saveLinks(projectId, projectLinks);
}

export function saveProjectVariablesSnapshot(
  projectId: string,
  variables: ProjectVariable[],
): void {
  const projectVariables = variables.filter(
    (variable) => variable.projectId === projectId,
  );

  void getReferenceRepository().saveVariables(projectId, projectVariables);
}
