import type { LoreEntry } from "@/lib/domain/lore";
import type { Scene } from "@/lib/domain/scene";

export interface LoreSceneAssociation {
  sceneId: string;
  sceneTitle: string;
  matchedFields: string[];
  snippet: string;
}

export function normalizeKeyword(value: string): string {
  return value.trim().toLowerCase();
}

export function collectLoreKeywords(entry: LoreEntry): string[] {
  return [entry.name, ...entry.tags]
    .map(normalizeKeyword)
    .filter((keyword) => keyword.length > 0);
}

/**
 * 给定一条设定与项目场景列表，扫描每个场景的标题、简介和正文块，
 * 命中任一关键词时返回命中字段名与首段命中的片段。
 */
export function resolveLoreSceneAssociations(
  entry: LoreEntry,
  scenes: Scene[],
): LoreSceneAssociation[] {
  const keywords = collectLoreKeywords(entry);
  if (keywords.length === 0) {
    return [];
  }

  return scenes.flatMap((scene) => {
    const matchedFields: string[] = [];
    const snippets: string[] = [];

    const title = scene.title.trim();
    if (
      title.length > 0 &&
      keywords.some((keyword) => normalizeKeyword(title).includes(keyword))
    ) {
      matchedFields.push("标题");
      snippets.push(title);
    }

    const summary = scene.summary.trim();
    if (
      summary.length > 0 &&
      keywords.some((keyword) => normalizeKeyword(summary).includes(keyword))
    ) {
      matchedFields.push("简介");
      snippets.push(summary);
    }

    scene.blocks.forEach((block, index) => {
      const content = block.contentText.trim();
      if (
        content.length > 0 &&
        keywords.some((keyword) => normalizeKeyword(content).includes(keyword))
      ) {
        matchedFields.push(`正文块 ${index + 1}`);
        snippets.push(content);
      }
    });

    const uniqueMatchedFields = [...new Set(matchedFields)];
    if (uniqueMatchedFields.length === 0) {
      return [];
    }

    return [
      {
        sceneId: scene.id,
        sceneTitle: title || "未命名场景",
        matchedFields: uniqueMatchedFields,
        snippet: snippets[0] ?? "",
      },
    ];
  });
}
