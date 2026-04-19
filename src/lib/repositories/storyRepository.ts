import type { SceneBlock } from "../domain/block";
import type { SceneLink } from "../domain/link";
import type { Scene } from "../domain/scene";

export interface StoryRepository {
  listScenes(projectId: string): Promise<Scene[]>;
  createScene(
    input: Pick<Scene, "projectId" | "routeId" | "title" | "chapterLabel"> & {
      scene?: Scene;
    },
  ): Promise<Scene>;
  updateScene(scene: Scene): Promise<void>;
  deleteScene(sceneId: string): Promise<void>;
  saveBlocks(sceneId: string, blocks: SceneBlock[]): Promise<void>;
  listLinks(projectId: string): Promise<SceneLink[]>;
  saveLinks(projectId: string, links: SceneLink[]): Promise<void>;
}
