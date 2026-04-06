export type LoreCategory = "location" | "term" | "world_rule" | "event";

export interface LoreEntry {
  id: string;
  projectId: string;
  name: string;
  category: LoreCategory;
  description: string;
  tags: string[];
}

export function createEmptyLoreEntry(input: {
  projectId: string;
  index: number;
}): LoreEntry {
  const nextIndex = input.index + 1;

  return {
    id: crypto.randomUUID(),
    projectId: input.projectId,
    name: `未命名设定 ${nextIndex}`,
    category: "term",
    description: "",
    tags: [],
  };
}
