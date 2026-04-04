export type LoreCategory = "location" | "term" | "world_rule" | "event";

export interface LoreEntry {
  id: string;
  projectId: string;
  name: string;
  category: LoreCategory;
  description: string;
  tags: string[];
}
