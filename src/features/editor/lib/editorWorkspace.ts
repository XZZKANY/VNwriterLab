import type { Project } from "@/lib/domain/project";
import type { Scene } from "@/lib/domain/scene";
import type { ProjectVariable } from "@/lib/domain/variable";

export interface EditorWorkspace {
  visibleScenes: Scene[];
  selectedScene: Scene | null;
  projectVariables: ProjectVariable[];
  selectedVariable: ProjectVariable | null;
}

interface BuildEditorWorkspaceInput {
  currentProject: Project | null;
  scenes: Scene[];
  variables: ProjectVariable[];
  selectedSceneId: string | null;
  selectedVariableId: string | null;
}

export function buildEditorWorkspace(
  input: BuildEditorWorkspaceInput,
): EditorWorkspace {
  const visibleScenes = input.currentProject
    ? input.scenes.filter(
        (scene) => scene.projectId === input.currentProject!.id,
      )
    : input.scenes;

  const selectedScene =
    visibleScenes.find((scene) => scene.id === input.selectedSceneId) ?? null;

  const projectVariables = input.currentProject
    ? input.variables.filter(
        (variable) => variable.projectId === input.currentProject!.id,
      )
    : [];

  const selectedVariable =
    projectVariables.find(
      (variable) => variable.id === input.selectedVariableId,
    ) ??
    projectVariables[0] ??
    null;

  return { visibleScenes, selectedScene, projectVariables, selectedVariable };
}
