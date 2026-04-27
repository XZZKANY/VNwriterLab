import { getProjectRepository } from "@/lib/repositories/projectRepositoryRuntime";
import { useAutoSaveStore } from "@/lib/store/useAutoSaveStore";
import { syncEditorOnProjectHydrate } from "../editorSync";
import type {
  ProjectHydrationSlice,
  ProjectSliceCreator,
} from "../projectStore.types";

const initialHydrationState: Pick<ProjectHydrationSlice, "currentProject"> = {
  currentProject: null,
};

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
    syncEditorOnProjectHydrate(hydratedProject);
    useAutoSaveStore.getState().markHydrated(true);
  },
});
