export type BlockType =
  | "narration"
  | "dialogue"
  | "choice"
  | "condition"
  | "note";

export interface SceneBlock {
  id: string;
  sceneId: string;
  blockType: BlockType;
  sortOrder: number;
  characterId: string | null;
  contentText: string;
  metaJson: string | null;
}
