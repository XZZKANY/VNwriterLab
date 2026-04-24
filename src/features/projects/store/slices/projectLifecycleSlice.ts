import type {
  ProjectLifecycleSlice,
  ProjectSliceCreator,
} from "../projectStore.types";

export const createProjectLifecycleSlice: ProjectSliceCreator<
  ProjectLifecycleSlice
> = (_set, _get) => ({
  createProject(name, summary, template) {
    void name;
    void summary;
    void template;
  },
  resetProject() {
    return;
  },
});
