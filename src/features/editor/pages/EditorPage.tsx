import { AutoSaveStatus } from "../../../app/components/AutoSaveStatus";
import { useProjectStore } from "../../projects/store/useProjectStore";
import { SceneBlockList } from "../components/SceneBlockList";
import { SceneTree } from "../components/SceneTree";
import { useEditorStore } from "../store/useEditorStore";

export function EditorPage() {
  const scenes = useEditorStore((state) => state.scenes);
  const selectedSceneId = useEditorStore((state) => state.selectedSceneId);
  const variables = useEditorStore((state) => state.variables);
  const selectedVariableId = useEditorStore((state) => state.selectedVariableId);
  const createScene = useEditorStore((state) => state.createScene);
  const importScene = useEditorStore((state) => state.importScene);
  const selectScene = useEditorStore((state) => state.selectScene);
  const createVariable = useEditorStore((state) => state.createVariable);
  const selectVariable = useEditorStore((state) => state.selectVariable);
  const deleteVariable = useEditorStore((state) => state.deleteVariable);
  const updateVariable = useEditorStore((state) => state.updateVariable);
  const addBlock = useEditorStore((state) => state.addBlock);
  const deleteBlock = useEditorStore((state) => state.deleteBlock);
  const moveBlockUp = useEditorStore((state) => state.moveBlockUp);
  const moveBlockDown = useEditorStore((state) => state.moveBlockDown);
  const updateBlockContent = useEditorStore((state) => state.updateBlockContent);
  const updateChoiceBlock = useEditorStore((state) => state.updateChoiceBlock);
  const updateConditionBlock = useEditorStore(
    (state) => state.updateConditionBlock,
  );
  const updateLocalScene = useEditorStore((state) => state.updateScene);
  const currentProject = useProjectStore((state) => state.currentProject);
  const createProjectSceneInRoute = useProjectStore(
    (state) => state.createSceneInRoute,
  );
  const updateProjectScene = useProjectStore((state) => state.updateScene);

  const selectedScene =
    scenes.find((scene) => scene.id === selectedSceneId) ?? null;
  const projectVariables = currentProject
    ? variables.filter((variable) => variable.projectId === currentProject.id)
    : [];
  const selectedVariable =
    projectVariables.find((variable) => variable.id === selectedVariableId) ??
    projectVariables[0] ??
    null;

  function handleSceneUpdate(
    sceneId: string,
    input: Parameters<typeof updateProjectScene>[1],
  ) {
    if (currentProject) {
      updateProjectScene(sceneId, input);
      return;
    }

    updateLocalScene(sceneId, input);
  }

  function handleCreateScene(routeId?: string) {
    if (currentProject && routeId) {
      const nextScene = createProjectSceneInRoute(routeId);
      if (nextScene) {
        importScene(nextScene);
        return;
      }
    }

    createScene({
      projectId: currentProject?.id,
      routeId,
    });
  }

  return (
    <section>
      <h2>剧情编辑</h2>
      <AutoSaveStatus />
      <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: 16 }}>
        <SceneTree
          routes={currentProject?.routes}
          scenes={scenes}
          selectedSceneId={selectedSceneId}
          onCreateScene={handleCreateScene}
          onSelectScene={selectScene}
        />
        <div>
          {currentProject ? (
            <div
              style={{
                marginBottom: 16,
                display: "grid",
                gridTemplateColumns: "220px 1fr",
                gap: 16,
              }}
            >
              <aside>
                <h3>变量</h3>
                <button
                  type="button"
                  onClick={() => {
                    createVariable(currentProject.id);
                  }}
                >
                  新增变量
                </button>
                <ul>
                  {projectVariables.map((variable) => (
                    <li key={variable.id}>
                      <button
                        type="button"
                        aria-pressed={variable.id === selectedVariable?.id}
                        onClick={() => selectVariable(variable.id)}
                      >
                        {variable.name}
                      </button>
                    </li>
                  ))}
                </ul>
              </aside>
              <article>
                <h3>变量详情</h3>
                {selectedVariable ? (
                  <>
                    <label>
                      变量名称
                      <input
                        aria-label="变量名称"
                        value={selectedVariable.name}
                        onChange={(event) =>
                          updateVariable(selectedVariable.id, {
                            name: event.target.value,
                          })
                        }
                      />
                    </label>
                    <label>
                      变量类型
                      <select
                        aria-label="变量类型"
                        value={selectedVariable.variableType}
                        onChange={(event) =>
                          updateVariable(selectedVariable.id, {
                            variableType:
                              event.target.value === "number"
                                ? "number"
                                : "flag",
                          })
                        }
                      >
                        <option value="flag">标记</option>
                        <option value="number">数值</option>
                      </select>
                    </label>
                    {selectedVariable.variableType === "flag" ? (
                      <label>
                        默认值
                        <select
                          aria-label="默认值"
                          value={String(selectedVariable.defaultValue)}
                          onChange={(event) =>
                            updateVariable(selectedVariable.id, {
                              defaultValue: Number(event.target.value) || 0,
                            })
                          }
                        >
                          <option value="0">关闭</option>
                          <option value="1">开启</option>
                        </select>
                      </label>
                    ) : (
                      <label>
                        默认值
                        <input
                          aria-label="默认值"
                          type="number"
                          value={selectedVariable.defaultValue}
                          onChange={(event) =>
                            updateVariable(selectedVariable.id, {
                              defaultValue: Number(event.target.value) || 0,
                            })
                          }
                          />
                      </label>
                    )}
                    <button
                      type="button"
                      onClick={() => deleteVariable(selectedVariable.id)}
                    >
                      删除变量
                    </button>
                  </>
                ) : (
                  <p>点击“新增变量”开始配置基础标记。</p>
                )}
              </article>
            </div>
          ) : null}
          {selectedScene ? (
            <article style={{ marginBottom: 16 }}>
              <h3>场景基础信息</h3>
              <label>
                标题
                <input
                  aria-label="场景标题"
                  value={selectedScene.title}
                  onChange={(event) =>
                    handleSceneUpdate(selectedScene.id, {
                      title: event.target.value,
                    })
                  }
                />
              </label>
              <label>
                摘要
                <textarea
                  aria-label="场景摘要"
                  value={selectedScene.summary}
                  onChange={(event) =>
                    handleSceneUpdate(selectedScene.id, {
                      summary: event.target.value,
                    })
                  }
                />
              </label>
              <label>
                场景类型
                <select
                  aria-label="场景类型"
                  value={selectedScene.sceneType}
                  onChange={(event) =>
                    handleSceneUpdate(selectedScene.id, {
                      sceneType: event.target.value as
                        | "normal"
                        | "branch"
                        | "ending",
                    })
                  }
                >
                  <option value="normal">普通</option>
                  <option value="branch">分支</option>
                  <option value="ending">结局</option>
                </select>
              </label>
              <label>
                状态
                <select
                  aria-label="场景状态"
                  value={selectedScene.status}
                  onChange={(event) =>
                    handleSceneUpdate(selectedScene.id, {
                      status: event.target.value as
                        | "draft"
                        | "completed"
                        | "needs_revision",
                    })
                  }
                >
                  <option value="draft">草稿</option>
                  <option value="completed">已完成</option>
                  <option value="needs_revision">需修改</option>
                </select>
              </label>
              <label>
                <input
                  aria-label="是否起始场景"
                  type="checkbox"
                  checked={selectedScene.isStartScene}
                  onChange={(event) =>
                    handleSceneUpdate(selectedScene.id, {
                      isStartScene: event.target.checked,
                    })
                  }
                />
                是否起始场景
              </label>
              <label>
                <input
                  aria-label="是否结局场景"
                  type="checkbox"
                  checked={selectedScene.isEndingScene}
                  onChange={(event) =>
                    handleSceneUpdate(selectedScene.id, {
                      isEndingScene: event.target.checked,
                    })
                  }
                />
                是否结局场景
              </label>
            </article>
          ) : null}
          <button type="button" onClick={() => addBlock("narration")}>
            新增旁白
          </button>
          <button type="button" onClick={() => addBlock("dialogue")}>
            新增对白
          </button>
          <button type="button" onClick={() => addBlock("note")}>
            新增注释
          </button>
          <button type="button" onClick={() => addBlock("choice")}>
            新增选项
          </button>
          <button type="button" onClick={() => addBlock("condition")}>
            新增条件
          </button>
          {selectedScene ? (
            <SceneBlockList
              sceneId={selectedScene.id}
              blocks={selectedScene.blocks}
              scenes={scenes}
              variables={projectVariables}
              onDeleteBlock={deleteBlock}
              onMoveBlockUp={moveBlockUp}
              onMoveBlockDown={moveBlockDown}
              onUpdateBlockContent={updateBlockContent}
              onUpdateChoiceBlock={updateChoiceBlock}
              onUpdateConditionBlock={updateConditionBlock}
            />
          ) : (
            <p>请选择或创建一个场景。</p>
          )}
        </div>
      </div>
    </section>
  );
}
