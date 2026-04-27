import { createEmptyProject, type ProjectTemplate } from "@/lib/domain/project";
import { getProjectRepository } from "@/lib/repositories/projectRepositoryRuntime";
import { withAutosave } from "@/lib/store/autosave";
import { replaceEditorOnProjectCreate } from "../editorSync";
import type {
  ProjectLifecycleSlice,
  ProjectSliceCreator,
} from "../projectStore.types";

export const createProjectLifecycleSlice: ProjectSliceCreator<
  ProjectLifecycleSlice
> = (set) => ({
  createProject: withAutosave(
    (name: string, summary: string, template?: ProjectTemplate) => {
      const nextProject = createEmptyProject(name, summary, template);
      set({
        currentProject: nextProject,
      });
      replaceEditorOnProjectCreate(nextProject);

      void getProjectRepository().createProject({
        name,
        summary,
        template,
        project: nextProject,
      });
    },
  ),
  resetProject() {
    set({
      currentProject: null,
    });
  },
});
