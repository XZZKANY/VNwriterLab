import type { Project } from "../../../../lib/domain/project";
import { getProjectRepository } from "../../../../lib/repositories/projectRepositoryRuntime";
import { useAutoSaveStore } from "../../../../lib/store/useAutoSaveStore";
import { useEditorStore } from "../../../editor/store/useEditorStore";
import { syncEditorScenesFromProjectScenes } from "../projectSceneUtils";
import type {
  ProjectHydrationSlice,
  ProjectSliceCreator,
} from "../projectStore.types";

const initialHydrationState: Pick<ProjectHydrationSlice, "currentProject"> = {
  currentProject: null,
};

function hydrateEditorStateFromProject(project: Project) {
  const currentEditorState = useEditorStore.getState();
  const syncedScenes =
    currentEditorState.scenes.length > 0
      ? syncEditorScenesFromProjectScenes(
          project.routes,
          project.scenes,
          currentEditorState.scenes,
        )
      : project.scenes;
  const nextScenes = syncedScenes.length > 0 ? syncedScenes : project.scenes;
  const nextSceneIds = new Set(nextScenes.map((scene) => scene.id));

  useEditorStore.setState({
    scenes: nextScenes,
    selectedSceneId:
      currentEditorState.selectedSceneId &&
      nextSceneIds.has(currentEditorState.selectedSceneId)
        ? currentEditorState.selectedSceneId
        : nextScenes[0]?.id ?? null,
    links: currentEditorState.links.filter(
      (link) =>
        nextSceneIds.has(link.fromSceneId) && nextSceneIds.has(link.toSceneId),
    ),
    variables: currentEditorState.variables.filter(
      (variable) => variable.projectId === project.id,
    ),
    selectedVariableId:
      currentEditorState.selectedVariableId &&
      currentEditorState.variables.some(
        (variable) =>
          variable.id === currentEditorState.selectedVariableId &&
          variable.projectId === project.id,
      )
        ? currentEditorState.selectedVariableId
        : null,
  });
}

export const createProjectHydrationSlice: ProjectSliceCreator<
  ProjectHydrationSlice
> = (set, get) => ({
  ...initialHydrationState,
  async hydrateLatestProject() {
    if (get().currentProject) {
      return;
    }

    const repository = getProjectRepository();
    const projects = await repository.listProjects();
    const latestProject = projects[0];

    if (!latestProject) {
      useAutoSaveStore.getState().markHydrated(false);
      return;
    }

    const hydratedProject =
      (await repository.getProject(latestProject.id)) ?? latestProject;

    set({
      currentProject: hydratedProject,
    });
    hydrateEditorStateFromProject(hydratedProject);
    useAutoSaveStore.getState().markHydrated(true);
  },
});
