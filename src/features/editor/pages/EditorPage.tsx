import { SceneBlockList } from "../components/SceneBlockList";
import { SceneTree } from "../components/SceneTree";
import { useEditorStore } from "../store/useEditorStore";

export function EditorPage() {
  const scenes = useEditorStore((state) => state.scenes);
  const selectedSceneId = useEditorStore((state) => state.selectedSceneId);
  const createScene = useEditorStore((state) => state.createScene);
  const addBlock = useEditorStore((state) => state.addBlock);

  const selectedScene =
    scenes.find((scene) => scene.id === selectedSceneId) ?? null;

  return (
    <section>
      <h2>剧情编辑</h2>
      <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: 16 }}>
        <SceneTree scenes={scenes} onCreateScene={createScene} />
        <div>
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
            <SceneBlockList blocks={selectedScene.blocks} />
          ) : (
            <p>请选择或创建一个场景。</p>
          )}
        </div>
      </div>
    </section>
  );
}
