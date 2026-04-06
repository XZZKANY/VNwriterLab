import { useProjectStore } from "../../projects/store/useProjectStore";
import { useEditorStore } from "../../editor/store/useEditorStore";
import { useCharacterStore } from "../store/useCharacterStore";
import type { Project } from "../../../lib/domain/project";
import type { Scene } from "../../../lib/domain/scene";

function getCharacterRouteSummary(
  currentProject: Project,
  routeId: string | null,
) {
  if (!routeId) {
    return null;
  }

  const route = currentProject.routes.find((item) => item.id === routeId);
  if (!route) {
    return {
      title: "未找到关联路线",
      description: "当前角色关联的路线已不存在。",
      scenes: [],
    };
  }

  const scenes = currentProject.scenes
    .filter((scene) => scene.routeId === route.id)
    .sort((left, right) => left.sortOrder - right.sortOrder);

  return {
    title: route.name,
    description: route.description,
    scenes,
  };
}

function getCharacterSceneReferences(
  editorScenes: Scene[],
  characterId: string,
) {
  return editorScenes
    .map((scene) => {
      const blockCount = scene.blocks.filter(
        (block) => block.characterId === characterId,
      ).length;

      return blockCount > 0 ? { scene, blockCount } : null;
    })
    .filter(
      (
        item,
      ): item is {
        scene: Scene;
        blockCount: number;
      } => item !== null,
    )
    .sort((left, right) => {
      if (left.blockCount === right.blockCount) {
        return left.scene.sortOrder - right.scene.sortOrder;
      }

      return right.blockCount - left.blockCount;
    });
}

export function CharactersPage() {
  const currentProject = useProjectStore((state) => state.currentProject);
  const editorScenes = useEditorStore((state) => state.scenes);
  const characters = useCharacterStore((state) => state.characters);
  const selectedCharacterId = useCharacterStore(
    (state) => state.selectedCharacterId,
  );
  const createCharacter = useCharacterStore((state) => state.createCharacter);
  const selectCharacter = useCharacterStore((state) => state.selectCharacter);
  const updateCharacter = useCharacterStore((state) => state.updateCharacter);

  const projectCharacters = currentProject
    ? characters.filter((character) => character.projectId === currentProject.id)
    : [];
  const selectedCharacter =
    projectCharacters.find((character) => character.id === selectedCharacterId) ??
    projectCharacters[0] ??
    null;
  const routeSummary =
    currentProject && selectedCharacter
      ? getCharacterRouteSummary(currentProject, selectedCharacter.routeId)
      : null;
  const sceneReferences = selectedCharacter
    ? getCharacterSceneReferences(editorScenes, selectedCharacter.id)
    : [];

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
        <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 16 }}>
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
                <label>
                  姓名
                  <input
                    value={selectedCharacter.name}
                    onChange={(event) =>
                      updateCharacter(selectedCharacter.id, {
                        name: event.target.value,
                      })
                    }
                  />
                </label>
                <label>
                  身份
                  <input
                    value={selectedCharacter.identity}
                    onChange={(event) =>
                      updateCharacter(selectedCharacter.id, {
                        identity: event.target.value,
                      })
                    }
                  />
                </label>
                <label>
                  性格
                  <textarea
                    value={selectedCharacter.personality}
                    onChange={(event) =>
                      updateCharacter(selectedCharacter.id, {
                        personality: event.target.value,
                      })
                    }
                  />
                </label>
                <label>
                  目标
                  <textarea
                    value={selectedCharacter.goal}
                    onChange={(event) =>
                      updateCharacter(selectedCharacter.id, {
                        goal: event.target.value,
                      })
                    }
                  />
                </label>
                <label>
                  秘密
                  <textarea
                    value={selectedCharacter.secret}
                    onChange={(event) =>
                      updateCharacter(selectedCharacter.id, {
                        secret: event.target.value,
                      })
                    }
                  />
                </label>
                <section aria-label="角色关联展示">
                  <h4>与路线的关联</h4>
                  {routeSummary ? (
                    <>
                      <p>{routeSummary.title}</p>
                      <p>{routeSummary.description}</p>
                      {routeSummary.scenes.length > 0 ? (
                        <ul aria-label="路线场景列表">
                          {routeSummary.scenes.map((scene) => (
                            <li key={scene.id}>{scene.title}</li>
                          ))}
                        </ul>
                      ) : (
                        <p>当前路线下暂无场景。</p>
                      )}
                    </>
                  ) : (
                    <p>当前角色尚未关联路线。</p>
                  )}
                </section>
                <section aria-label="角色场景引用">
                  <h4>被哪些场景引用</h4>
                  {sceneReferences.length > 0 ? (
                    <>
                      <p>当前角色在 {sceneReferences.length} 个场景中被引用。</p>
                      <ul aria-label="场景引用列表">
                        {sceneReferences.map(({ scene, blockCount }) => (
                          <li key={scene.id}>
                            {scene.title}（{blockCount} 处）
                          </li>
                        ))}
                      </ul>
                    </>
                  ) : (
                    <p>当前角色尚未被任何场景块引用。</p>
                  )}
                </section>
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
