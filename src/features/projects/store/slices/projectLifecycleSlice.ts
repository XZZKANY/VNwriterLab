import {
  createEmptyProject,
  type Project,
} from "../../../../lib/domain/project";
import { getProjectRepository } from "../../../../lib/repositories/projectRepositoryRuntime";
import { useAutoSaveStore } from "../../../../lib/store/useAutoSaveStore";
import { useEditorStore } from "../../../editor/store/useEditorStore";
import type {
  ProjectLifecycleSlice,
  ProjectSliceCreator,
} from "../projectStore.types";

function replaceEditorScenesFromProject(project: Project) {
  useEditorStore.setState({
    scenes: project.scenes,
    selectedSceneId: project.scenes[0]?.id ?? null,
    links: [],
    variables: [],
    selectedVariableId: null,
  });
}

export const createProjectLifecycleSlice: ProjectSliceCreator<
  ProjectLifecycleSlice
> = (set) => ({
  createProject(name, summary, template) {
    useAutoSaveStore.getState().markDirty();

    const nextProject = createEmptyProject(name, summary, template);
    set({
      currentProject: nextProject,
    });
    replaceEditorScenesFromProject(nextProject);
    useAutoSaveStore.getState().markSaved();

    void getProjectRepository().createProject({
      name,
      summary,
      template,
      project: nextProject,
    });
  },
  resetProject() {
    set({
      currentProject: null,
    });
  },
});
