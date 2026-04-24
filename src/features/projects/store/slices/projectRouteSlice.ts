import type { ProjectSliceCreator, ProjectRouteSlice } from "../projectStore.types";

export const createProjectRouteSlice: ProjectSliceCreator<ProjectRouteSlice> = (
  _set,
  _get,
) => ({
  createRoute(name) {
    void name;
  },
  renameRoute(routeId, name) {
    void routeId;
    void name;
  },
});
