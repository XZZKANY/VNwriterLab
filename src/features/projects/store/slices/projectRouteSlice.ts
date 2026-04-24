import {
  createRoute as createProjectRoute,
  type Project,
} from "../../../../lib/domain/project";
import { getProjectRepository } from "../../../../lib/repositories/projectRepositoryRuntime";
import { useAutoSaveStore } from "../../../../lib/store/useAutoSaveStore";
import type { ProjectSliceCreator, ProjectRouteSlice } from "../projectStore.types";

function saveProjectSnapshot(project: Project) {
  return getProjectRepository().updateProject(project);
}

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

    useAutoSaveStore.getState().markDirty();

    const nextProject = {
      ...currentProject,
      routes: [
        ...currentProject.routes,
        createProjectRoute({
          projectId: currentProject.id,
          name: trimmedName,
          sortOrder: currentProject.routes.length,
        }),
      ],
    };

    set({
      currentProject: nextProject,
    });
    useAutoSaveStore.getState().markSaved();

    void saveProjectSnapshot(nextProject);
  },
  renameRoute(routeId, name) {
    const trimmedName = name.trim();
    const currentProject = get().currentProject;
    if (!currentProject || !trimmedName) {
      return;
    }

    const targetRoute = currentProject.routes.find((route) => route.id === routeId);
    if (!targetRoute || targetRoute.name === trimmedName) {
      return;
    }

    useAutoSaveStore.getState().markDirty();

    const nextProject = {
      ...currentProject,
      routes: currentProject.routes.map((route) =>
        route.id === routeId ? { ...route, name: trimmedName } : route,
      ),
    };

    set({
      currentProject: nextProject,
    });
    useAutoSaveStore.getState().markSaved();

    void saveProjectSnapshot(nextProject);
  },
});
