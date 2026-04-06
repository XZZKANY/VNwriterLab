import type { Character } from "../../../lib/domain/character";
import type { LoreEntry } from "../../../lib/domain/lore";
import type { Project } from "../../../lib/domain/project";
import type { Scene } from "../../../lib/domain/scene";

export interface ProjectSearchSceneResult {
  sceneId: string;
  sceneTitle: string;
  matchedFields: string[];
  snippet: string;
}

export interface ProjectSearchCharacterResult {
  characterId: string;
  characterName: string;
  matchedFields: string[];
  snippet: string;
}

export interface ProjectSearchLoreResult {
  loreId: string;
  loreName: string;
  matchedFields: string[];
  snippet: string;
}

export interface ProjectSearchResult {
  sceneResults: ProjectSearchSceneResult[];
  characterResults: ProjectSearchCharacterResult[];
  loreResults: ProjectSearchLoreResult[];
}

interface SearchProjectContentInput {
  project: Project;
  editorScenes: Scene[];
  characters: Character[];
  loreEntries: LoreEntry[];
}

function normalizeKeyword(value: string) {
  return value.trim().toLowerCase();
}

function includesKeyword(value: string, keyword: string) {
  return normalizeKeyword(value).includes(keyword);
}

export function searchProjectContent(
  keyword: string,
  input: SearchProjectContentInput,
): ProjectSearchResult {
  const normalizedKeyword = normalizeKeyword(keyword);
  if (!normalizedKeyword) {
    return {
      sceneResults: [],
      characterResults: [],
      loreResults: [],
    };
  }

  const projectSceneIds = new Set(input.project.scenes.map((scene) => scene.id));
  const editorSceneMap = new Map(
    input.editorScenes
      .filter(
        (scene) =>
          scene.projectId === input.project.id && projectSceneIds.has(scene.id),
      )
      .map((scene) => [scene.id, scene] as const),
  );
  const projectScenes = input.project.scenes.map(
    (scene) => editorSceneMap.get(scene.id) ?? scene,
  );
  const projectCharacters = input.characters.filter(
    (character) => character.projectId === input.project.id,
  );
  const projectLoreEntries = input.loreEntries.filter(
    (entry) => entry.projectId === input.project.id,
  );

  return {
    sceneResults: projectScenes.flatMap((scene) => {
      const matchedFields: string[] = [];
      const snippets: string[] = [];

      if (scene.title && includesKeyword(scene.title, normalizedKeyword)) {
        matchedFields.push("标题");
        snippets.push(scene.title);
      }

      if (scene.summary && includesKeyword(scene.summary, normalizedKeyword)) {
        matchedFields.push("摘要");
        snippets.push(scene.summary);
      }

      scene.blocks.forEach((block, index) => {
        if (block.contentText && includesKeyword(block.contentText, normalizedKeyword)) {
          matchedFields.push(`正文块 ${index + 1}`);
          snippets.push(block.contentText);
        }
      });

      if (matchedFields.length === 0) {
        return [];
      }

      return [
        {
          sceneId: scene.id,
          sceneTitle: scene.title,
          matchedFields: [...new Set(matchedFields)],
          snippet: snippets[0] ?? "",
        },
      ];
    }),
    characterResults: projectCharacters.flatMap((character) => {
      const candidateFields = [
        ["姓名", character.name],
        ["身份", character.identity],
        ["性格", character.personality],
        ["目标", character.goal],
        ["秘密", character.secret],
      ] as const;
      const matchedFields = candidateFields
        .filter(([, value]) => value && includesKeyword(value, normalizedKeyword))
        .map(([field]) => field);
      const snippet =
        candidateFields.find(
          ([, value]) => value && includesKeyword(value, normalizedKeyword),
        )?.[1] ?? "";

      if (matchedFields.length === 0) {
        return [];
      }

      return [
        {
          characterId: character.id,
          characterName: character.name,
          matchedFields,
          snippet,
        },
      ];
    }),
    loreResults: projectLoreEntries.flatMap((entry) => {
      const tagsText = entry.tags.join("、");
      const candidateFields = [
        ["名称", entry.name],
        ["描述", entry.description],
        ["标签", tagsText],
      ] as const;
      const matchedFields = candidateFields
        .filter(([, value]) => value && includesKeyword(value, normalizedKeyword))
        .map(([field]) => field);
      const snippet =
        candidateFields.find(
          ([, value]) => value && includesKeyword(value, normalizedKeyword),
        )?.[1] ?? "";

      if (matchedFields.length === 0) {
        return [];
      }

      return [
        {
          loreId: entry.id,
          loreName: entry.name,
          matchedFields,
          snippet,
        },
      ];
    }),
  };
}
