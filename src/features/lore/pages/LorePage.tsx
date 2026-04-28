import { useEffect } from "react";
import { WorkspacePageHeader } from "@/app/components/workspace/WorkspacePageHeader";
import { WorkspacePanel } from "@/app/components/workspace/WorkspacePanel";
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

  function handleCreateLore() {
    if (currentProject) {
      createLoreEntry(currentProject.id);
    }
  }

  return (
    <section className="lore-page">
      <WorkspacePageHeader
        title="设定"
        description="整理世界观资料，并查看与场景的基础关联。"
        primaryAction={{
          label: "新建设定",
          onClick: handleCreateLore,
          disabled: !currentProject,
        }}
      />
      {!currentProject ? (
        <WorkspacePanel
          title="设定资料"
          description="请先创建项目，再开始整理设定资料。"
        >
          <p>请先创建项目，再开始整理设定资料。</p>
        </WorkspacePanel>
      ) : (
        <div className="resource-page__layout">
          <WorkspacePanel title="设定列表" ariaLabel="设定列表">
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
          </WorkspacePanel>
          <WorkspacePanel title="设定详情" ariaLabel="设定详情">
            {selectedEntry ? (
              <LoreDetailForm
                entry={selectedEntry}
                onUpdate={(input) => updateLoreEntry(selectedEntry.id, input)}
              />
            ) : (
              <p>点击“新建设定”开始整理世界观资料。</p>
            )}
          </WorkspacePanel>
          <WorkspacePanel title="设定辅助信息" ariaLabel="设定辅助信息">
            {selectedEntry ? (
              <LoreSceneAssociationList associations={relatedScenes} />
            ) : (
              <p>选中设定后会显示场景关联信息。</p>
            )}
          </WorkspacePanel>
        </div>
      )}
    </section>
  );
}
