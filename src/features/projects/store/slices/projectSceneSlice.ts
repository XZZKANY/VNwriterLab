import type { ProjectSceneSlice, ProjectSliceCreator } from "../projectStore.types";

export const createProjectSceneSlice: ProjectSliceCreator<ProjectSceneSlice> = (
  _set,
  _get,
) => ({
  createSceneInRoute(routeId) {
    void routeId;
    return null;
  },
  updateScene(sceneId, input) {
    void sceneId;
    void input;
  },
  deleteScene(sceneId) {
    void sceneId;
  },
  moveSceneUp(sceneId) {
    void sceneId;
  },
  moveSceneDown(sceneId) {
    void sceneId;
  },
  moveSceneToRoute(sceneId, targetRouteId) {
    void sceneId;
    void targetRouteId;
  },
});
