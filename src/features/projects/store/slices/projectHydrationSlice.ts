import type {
  ProjectHydrationSlice,
  ProjectSliceCreator,
} from "../projectStore.types";

const initialHydrationState: Pick<ProjectHydrationSlice, "currentProject"> = {
  currentProject: null,
};

export const createProjectHydrationSlice: ProjectSliceCreator<
  ProjectHydrationSlice
> = () => ({
  ...initialHydrationState,
  async hydrateLatestProject() {
    return;
  },
});
