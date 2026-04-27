import { useEffect } from "react";
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

  return (
    <section>
      <h2>角色</h2>
      <button
        type="button"
        onClick={() => {
          if (currentProject) {
            createCharacter(currentProject.id);
          }
        }}
      >
        新增角色
      </button>
      {!currentProject ? (
        <p>请先创建项目，再开始整理角色资料。</p>
      ) : (
        <div className="layout-split layout-split--narrow">
          <aside>
            <h3>角色列表</h3>
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
          </aside>
          <article>
            <h3>角色详情</h3>
            {selectedCharacter ? (
              <>
                <CharacterDetailForm
                  character={selectedCharacter}
                  onUpdate={(input) =>
                    updateCharacter(selectedCharacter.id, input)
                  }
                />
                <CharacterRouteSummary summary={routeSummary} />
                <CharacterSceneReferenceList references={sceneReferences} />
              </>
            ) : (
              <p>点击“新增角色”开始整理角色资料。</p>
            )}
          </article>
        </div>
      )}
    </section>
  );
}
