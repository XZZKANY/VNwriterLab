import type { Character } from "@/lib/domain/character";
import type { LoreEntry } from "@/lib/domain/lore";
import type { Project } from "@/lib/domain/project";
import type { Scene } from "@/lib/domain/scene";
import type { ProjectVariable } from "@/lib/domain/variable";
import { buildSceneGraph } from "@/features/graph/lib/graphData";
import type { SceneLink } from "@/features/editor/store/linkUtils";

export interface ProjectStats {
  routeCount: number;
  sceneCount: number;
  endingSceneCount: number;
  variableCount: number;
  characterCount: number;
  loreCount: number;
  issueSceneCount: number;
}

interface BuildProjectStatsInput {
  project: Project;
  editorScenes: Scene[];
  links: SceneLink[];
  variables: ProjectVariable[];
  characters: Character[];
  loreEntries: LoreEntry[];
}

export function buildProjectStats(input: BuildProjectStatsInput): ProjectStats {
  const editorSceneMap = new Map(
    input.editorScenes
      .filter((scene) => scene.projectId === input.project.id)
      .map((scene) => [scene.id, scene] as const),
  );
  const projectSceneMap = new Map(
    input.project.scenes.map((scene) => [scene.id, scene] as const),
  );
  const mergedSceneMap = new Map(projectSceneMap);

  for (const [sceneId, scene] of editorSceneMap) {
    mergedSceneMap.set(sceneId, scene);
  }

  const mergedScenes = [...mergedSceneMap.values()];
  const mergedSceneIds = new Set(mergedScenes.map((scene) => scene.id));
  const projectLinks = input.links.filter(
    (link) =>
      mergedSceneIds.has(link.fromSceneId) &&
      mergedSceneIds.has(link.toSceneId),
  );
  const projectVariables = input.variables.filter(
    (variable) => variable.projectId === input.project.id,
  );
  const projectCharacters = input.characters.filter(
    (character) => character.projectId === input.project.id,
  );
  const projectLoreEntries = input.loreEntries.filter(
    (entry) => entry.projectId === input.project.id,
  );
  const graph = buildSceneGraph(mergedScenes, projectLinks, projectVariables);

  return {
    routeCount: input.project.routes.length,
    sceneCount: mergedScenes.length,
    endingSceneCount: mergedScenes.filter((scene) => scene.isEndingScene)
      .length,
    variableCount: projectVariables.length,
    characterCount: projectCharacters.length,
    loreCount: projectLoreEntries.length,
    issueSceneCount: graph.issueSummaries.length,
  };
}
