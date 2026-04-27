import { useState } from "react";
import type { Character } from "@/lib/domain/character";
import type { LoreEntry } from "@/lib/domain/lore";
import type { Project } from "@/lib/domain/project";
import type { Scene } from "@/lib/domain/scene";
import {
  searchProjectContent,
  type ProjectSearchResult,
} from "../lib/projectSearch";
import {
  SearchResultSection,
  type SearchResultEntry,
} from "./SearchResultSection";

interface SearchPanelProps {
  project: Project;
  editorScenes: Scene[];
  characters: Character[];
  loreEntries: LoreEntry[];
}

function hasAnyResults(results: ProjectSearchResult): boolean {
  return (
    results.sceneResults.length > 0 ||
    results.characterResults.length > 0 ||
    results.loreResults.length > 0
  );
}

function adaptSceneResults(
  results: ProjectSearchResult["sceneResults"],
): SearchResultEntry[] {
  return results.map((result) => ({
    id: result.sceneId,
    title: result.sceneTitle,
    matchedFields: result.matchedFields,
    snippet: result.snippet,
  }));
}

function adaptCharacterResults(
  results: ProjectSearchResult["characterResults"],
): SearchResultEntry[] {
  return results.map((result) => ({
    id: result.characterId,
    title: result.characterName,
    matchedFields: result.matchedFields,
    snippet: result.snippet,
  }));
}

function adaptLoreResults(
  results: ProjectSearchResult["loreResults"],
): SearchResultEntry[] {
  return results.map((result) => ({
    id: result.loreId,
    title: result.loreName,
    matchedFields: result.matchedFields,
    snippet: result.snippet,
  }));
}

export function SearchPanel({
  project,
  editorScenes,
  characters,
  loreEntries,
}: SearchPanelProps) {
  const [keyword, setKeyword] = useState("");

  const results = keyword.trim()
    ? searchProjectContent(keyword, {
        project,
        editorScenes,
        characters,
        loreEntries,
      })
    : null;

  return (
    <section aria-label="项目全局搜索">
      <h4>项目全局搜索</h4>
      <label>
        搜索关键词
        <input
          aria-label="搜索关键词"
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
        />
      </label>
      {results ? (
        hasAnyResults(results) ? (
          <div>
            <h5>搜索结果</h5>
            <SearchResultSection
              ariaLabel="场景搜索结果"
              heading="场景"
              results={adaptSceneResults(results.sceneResults)}
              emptyMessage="未命中任何场景。"
            />
            <SearchResultSection
              ariaLabel="角色搜索结果"
              heading="角色"
              results={adaptCharacterResults(results.characterResults)}
              emptyMessage="未命中任何角色。"
            />
            <SearchResultSection
              ariaLabel="设定搜索结果"
              heading="设定"
              results={adaptLoreResults(results.loreResults)}
              emptyMessage="未命中任何设定。"
            />
          </div>
        ) : (
          <p>未找到匹配内容。</p>
        )
      ) : null}
    </section>
  );
}
