import { useEffect } from "react";
import { useProjectStore } from "@/features/projects/store/useProjectStore";
import { LoreDetailForm } from "../components/LoreDetailForm";
import { LoreSceneAssociationList } from "../components/LoreSceneAssociationList";
import { resolveLoreSceneAssociations } from "../lib/loreSceneAssociations";
import { useLoreStore } from "../store/useLoreStore";

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
        <div className="layout-split layout-split--narrow">
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
                <LoreDetailForm
                  entry={selectedEntry}
                  onUpdate={(input) => updateLoreEntry(selectedEntry.id, input)}
                />
                <LoreSceneAssociationList associations={relatedScenes} />
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
