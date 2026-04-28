import { useEffect } from "react";
import { WorkspacePageHeader } from "@/app/components/workspace/WorkspacePageHeader";
import { WorkspacePanel } from "@/app/components/workspace/WorkspacePanel";
import { useProjectStore } from "@/features/projects/store/useProjectStore";
import { useEditorStore } from "@/features/editor/store/useEditorStore";
import { CharacterDetailForm } from "../components/CharacterDetailForm";
import { CharacterRouteSummary } from "../components/CharacterRouteSummary";
import { CharacterSceneReferenceList } from "../components/CharacterSceneReferenceList";
import {
  getCharacterRouteSummary,
  getCharacterSceneReferences,
} from "../lib/characterReferences";
import { useCharacterStore } from "../store/useCharacterStore";

export function CharactersPage() {
  const currentProject = useProjectStore((state) => state.currentProject);
  const editorScenes = useEditorStore((state) => state.scenes);
  const characters = useCharacterStore((state) => state.characters);
  const selectedCharacterId = useCharacterStore(
    (state) => state.selectedCharacterId,
  );
  const hydrateCharacters = useCharacterStore(
    (state) => state.hydrateCharacters,
  );
  const createCharacter = useCharacterStore((state) => state.createCharacter);
  const selectCharacter = useCharacterStore((state) => state.selectCharacter);
  const updateCharacter = useCharacterStore((state) => state.updateCharacter);

  const projectCharacters = currentProject
    ? characters.filter(
        (character) => character.projectId === currentProject.id,
      )
    : [];
  const selectedCharacter =
    projectCharacters.find(
      (character) => character.id === selectedCharacterId,
    ) ??
    projectCharacters[0] ??
    null;
  const routeSummary =
    currentProject && selectedCharacter
      ? getCharacterRouteSummary(currentProject, selectedCharacter.routeId)
      : null;
  const sceneReferences =
    currentProject && selectedCharacter
      ? getCharacterSceneReferences(
          currentProject.routes,
          editorScenes,
          selectedCharacter.id,
        )
      : [];

  useEffect(() => {
    if (currentProject && projectCharacters.length === 0) {
      void hydrateCharacters(currentProject.id);
    }
  }, [currentProject, projectCharacters.length, hydrateCharacters]);

  function handleCreateCharacter() {
    if (currentProject) {
      createCharacter(currentProject.id);
    }
  }

  return (
    <section className="characters-page">
      <WorkspacePageHeader
        title="角色"
        description="集中管理角色列表、详情与场景关联。"
        primaryAction={{
          label: "新增角色",
          onClick: handleCreateCharacter,
          disabled: !currentProject,
        }}
      />
      {!currentProject ? (
        <WorkspacePanel
          title="角色资料"
          description="请先创建项目，再开始整理角色资料。"
        >
          <p>请先创建项目，再开始整理角色资料。</p>
        </WorkspacePanel>
      ) : (
        <div className="resource-page__layout">
          <WorkspacePanel title="角色列表" ariaLabel="角色列表">
            <ul>
              {projectCharacters.map((character) => (
                <li key={character.id}>
                  <button
                    type="button"
                    aria-pressed={character.id === selectedCharacter?.id}
                    onClick={() => selectCharacter(character.id)}
                  >
                    {character.name}
                  </button>
                </li>
              ))}
            </ul>
          </WorkspacePanel>
          <WorkspacePanel title="角色详情" ariaLabel="角色详情">
            {selectedCharacter ? (
              <CharacterDetailForm
                character={selectedCharacter}
                onUpdate={(input) =>
                  updateCharacter(selectedCharacter.id, input)
                }
              />
            ) : (
              <p>点击“新增角色”开始整理角色资料。</p>
            )}
          </WorkspacePanel>
          <WorkspacePanel title="角色辅助信息" ariaLabel="角色辅助信息">
            {selectedCharacter ? (
              <>
                <CharacterRouteSummary summary={routeSummary} />
                <CharacterSceneReferenceList references={sceneReferences} />
              </>
            ) : (
              <p>选中角色后会显示路线与场景引用。</p>
            )}
          </WorkspacePanel>
        </div>
      )}
    </section>
  );
}
