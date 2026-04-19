import { useEffect } from "react";
import { useProjectStore } from "../../projects/store/useProjectStore";
import { useLoreStore } from "../store/useLoreStore";
import type { LoreEntry } from "../../../lib/domain/lore";
import type { Scene } from "../../../lib/domain/scene";

interface SceneAssociation {
  sceneId: string;
  sceneTitle: string;
  matchedFields: string[];
  snippet: string;
}

function normalizeKeyword(value: string) {
  return value.trim().toLowerCase();
}

function collectLoreKeywords(entry: LoreEntry) {
  return [entry.name, ...entry.tags]
    .map(normalizeKeyword)
    .filter((keyword) => keyword.length > 0);
}

function resolveLoreSceneAssociations(
  entry: LoreEntry,
  scenes: Scene[],
): SceneAssociation[] {
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

export function LorePage() {
  const currentProject = useProjectStore((state) => state.currentProject);
  const entries = useLoreStore((state) => state.entries);
  const selectedLoreId = useLoreStore((state) => state.selectedLoreId);
  const hydrateLoreEntries = useLoreStore((state) => state.hydrateLoreEntries);
  const createLoreEntry = useLoreStore((state) => state.createLoreEntry);
  const selectLoreEntry = useLoreStore((state) => state.selectLoreEntry);
  const updateLoreEntry = useLoreStore((state) => state.updateLoreEntry);

  const projectEntries = currentProject
    ? entries.filter((entry) => entry.projectId === currentProject.id)
    : [];
  const selectedEntry =
    projectEntries.find((entry) => entry.id === selectedLoreId) ??
    projectEntries[0] ??
    null;
  const relatedScenes =
    currentProject && selectedEntry
      ? resolveLoreSceneAssociations(selectedEntry, currentProject.scenes)
      : [];

  useEffect(() => {
    if (currentProject && projectEntries.length === 0) {
      void hydrateLoreEntries(currentProject.id);
    }
  }, [currentProject, projectEntries.length, hydrateLoreEntries]);

  return (
    <section>
      <h2>设定</h2>
      <button
        type="button"
        onClick={() => {
          if (currentProject) {
            createLoreEntry(currentProject.id);
          }
        }}
      >
        新建设定
      </button>
      {!currentProject ? (
        <p>请先创建项目，再开始整理设定资料。</p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 16 }}>
          <aside>
            <h3>设定列表</h3>
            <ul>
              {projectEntries.map((entry) => (
                <li key={entry.id}>
                  <button
                    type="button"
                    aria-pressed={entry.id === selectedEntry?.id}
                    onClick={() => selectLoreEntry(entry.id)}
                  >
                    {entry.name}
                  </button>
                </li>
              ))}
            </ul>
          </aside>
          <article>
            <h3>设定详情</h3>
            {selectedEntry ? (
              <>
                <label>
                  名称
                  <input
                    value={selectedEntry.name}
                    onChange={(event) =>
                      updateLoreEntry(selectedEntry.id, {
                        name: event.target.value,
                      })
                    }
                  />
                </label>
                <label>
                  分类
                  <select
                    aria-label="分类"
                    value={selectedEntry.category}
                    onChange={(event) =>
                      updateLoreEntry(selectedEntry.id, {
                        category: event.target.value as typeof selectedEntry.category,
                      })
                    }
                  >
                    <option value="location">地点</option>
                    <option value="term">术语</option>
                    <option value="world_rule">世界规则</option>
                    <option value="event">事件</option>
                  </select>
                </label>
                <label>
                  描述
                  <textarea
                    value={selectedEntry.description}
                    onChange={(event) =>
                      updateLoreEntry(selectedEntry.id, {
                        description: event.target.value,
                      })
                    }
                  />
                </label>
                <section aria-label="与场景的基础关联">
                  <h4>与场景的基础关联</h4>
                  {relatedScenes.length > 0 ? (
                    <ul>
                      {relatedScenes.map((association) => (
                        <li key={association.sceneId}>
                          <strong>{association.sceneTitle}</strong>
                          <div>命中字段：{association.matchedFields.join("、")}</div>
                          <div>提及内容：{association.snippet}</div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p>当前设定还没有在场景标题、简介或正文中被提及。</p>
                  )}
                </section>
              </>
            ) : (
              <p>点击“新建设定”开始整理世界观资料。</p>
            )}
          </article>
        </div>
      )}
    </section>
  );
}
