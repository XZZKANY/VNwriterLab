import { createEmptyProject } from "../../../../lib/domain/project";
import type {
  ProjectLifecycleSlice,
  ProjectSliceCreator,
} from "../projectStore.types";

export const createProjectLifecycleSlice: ProjectSliceCreator<
  ProjectLifecycleSlice
> = (set) => ({
  createProject(name, summary, template) {
    const nextProject = createEmptyProject(name, summary, template);
    set({ currentProject: nextProject });
  },
  resetProject() {
    set({ currentProject: null });
  },
});
