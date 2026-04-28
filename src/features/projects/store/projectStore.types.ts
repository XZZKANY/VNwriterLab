import type { Project, ProjectTemplate } from "@/lib/domain/project";
import type { Scene } from "@/lib/domain/scene";
import type { ProjectVariable } from "@/lib/domain/variable";
import type { SceneLink } from "@/features/editor/store/linkUtils";
import type { StateCreator } from "zustand";

/**
 * 项目导入时一次性提供的完整数据负载。
 * 与 projectExport.ProjectExportPayload 镜像一致——这样 export 出来的 JSON
 * 可以直接喂回给 importProject。
 */
export interface ProjectImportInput {
  project: Project;
  scenes: Scene[];
  links: SceneLink[];
  variables: ProjectVariable[];
}

export type ProjectSceneUpdateInput = Partial<
  Pick<
    Scene,
    | "title"
    | "summary"
    | "sceneType"
    | "status"
    | "chapterLabel"
    | "notes"
    | "isStartScene"
    | "isEndingScene"
  >
>;

export interface ProjectHydrationSlice {
  currentProject: Project | null;
  hydrateLatestProject: () => Promise<void>;
}

export interface ProjectLifecycleSlice {
  createProject: (
    name: string,
    summary: string,
    template?: ProjectTemplate,
  ) => void;
  importProject: (input: ProjectImportInput) => void;
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
