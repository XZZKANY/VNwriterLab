import { createRoute as createProjectRoute } from "../../../../lib/domain/project";
import type { ProjectSliceCreator, ProjectRouteSlice } from "../projectStore.types";

export const createProjectRouteSlice: ProjectSliceCreator<ProjectRouteSlice> = (
  set,
  get,
) => ({
  createRoute(name) {
    const trimmedName = name.trim();
    const currentProject = get().currentProject;
    if (!currentProject || !trimmedName) {
      return;
    }

    set({
      currentProject: {
        ...currentProject,
        routes: [
          ...currentProject.routes,
          createProjectRoute({
            projectId: currentProject.id,
            name: trimmedName,
            sortOrder: currentProject.routes.length,
          }),
        ],
      },
    });
  },
  renameRoute(routeId, name) {
    const trimmedName = name.trim();
    const currentProject = get().currentProject;
    if (!currentProject || !trimmedName) {
      return;
    }

    set({
      currentProject: {
        ...currentProject,
        routes: currentProject.routes.map((route) =>
          route.id === routeId ? { ...route, name: trimmedName } : route,
        ),
      },
    });
  },
});
