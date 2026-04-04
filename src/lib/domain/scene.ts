import type { SceneBlock } from "./block";

export type SceneType = "normal" | "branch" | "ending";
export type SceneStatus = "draft" | "completed" | "needs_revision";

export interface Scene {
  id: string;
  projectId: string;
  routeId: string;
  title: string;
  summary: string;
  sceneType: SceneType;
  status: SceneStatus;
  chapterLabel: string;
  sortOrder: number;
  isStartScene: boolean;
  isEndingScene: boolean;
  notes: string;
  blocks: SceneBlock[];
}
