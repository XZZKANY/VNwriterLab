import type { Project, ProjectTemplate } from "../../../lib/domain/project";
import type { Scene } from "../../../lib/domain/scene";
import type { StateCreator } from "zustand";

export type ProjectSceneUpdateInput = Partial<
  Pick<
    Scene,
    "title" | "summary" | "sceneType" | "status" | "isStartScene" | "isEndingScene"
  >
>;

export interface ProjectHydrationSlice {
  currentProject: Project | null;
  hydrateLatestProject: () => Promise<void>;
}

export interface ProjectLifecycleSlice {
  createProject: (name: string, summary: string, template?: ProjectTemplate) => void;
  resetProject: () => void;
}

export interface ProjectRouteSlice {
  createRoute: (name: string) => void;
  renameRoute: (routeId: string, name: string) => void;
}

export interface ProjectSceneSlice {
  createSceneInRoute: (routeId: string) => Scene | null;
  updateScene: (sceneId: string, input: ProjectSceneUpdateInput) => void;
  deleteScene: (sceneId: string) => void;
  moveSceneUp: (sceneId: string) => void;
  moveSceneDown: (sceneId: string) => void;
  moveSceneToRoute: (sceneId: string, targetRouteId: string) => void;
}

export type ProjectStoreState = ProjectHydrationSlice &
  ProjectLifecycleSlice &
  ProjectRouteSlice &
  ProjectSceneSlice;

export type ProjectSliceCreator<TSlice> = StateCreator<
  ProjectStoreState,
  [],
  [],
  TSlice
>;
