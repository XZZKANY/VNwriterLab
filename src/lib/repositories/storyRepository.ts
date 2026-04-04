import type { SceneBlock } from "../domain/block";
import type { Scene } from "../domain/scene";

export interface StoryRepository {
  listScenes(projectId: string): Promise<Scene[]>;
  createScene(
    input: Pick<Scene, "projectId" | "routeId" | "title" | "chapterLabel">,
  ): Promise<Scene>;
  updateScene(scene: Scene): Promise<void>;
  saveBlocks(sceneId: string, blocks: SceneBlock[]): Promise<void>;
}
