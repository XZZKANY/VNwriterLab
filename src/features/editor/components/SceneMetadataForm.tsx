import type { Scene } from "@/lib/domain/scene";
import type { EditorSceneUpdateInput } from "../store/editorStore.types";

interface SceneMetadataFormProps {
  scene: Scene;
  onUpdate: (input: EditorSceneUpdateInput) => void;
}

export function SceneMetadataForm({ scene, onUpdate }: SceneMetadataFormProps) {
  return (
    <article style={{ marginBottom: 16 }}>
      <h3>场景基础信息</h3>
      <label>
        标题
        <input
          aria-label="场景标题"
          value={scene.title}
          onChange={(event) => onUpdate({ title: event.target.value })}
        />
      </label>
      <label>
        摘要
        <textarea
          aria-label="场景摘要"
          value={scene.summary}
          onChange={(event) => onUpdate({ summary: event.target.value })}
        />
      </label>
      <label>
        场景类型
        <select
          aria-label="场景类型"
          value={scene.sceneType}
          onChange={(event) =>
            onUpdate({
              sceneType: event.target.value as "normal" | "branch" | "ending",
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
          value={scene.status}
          onChange={(event) =>
            onUpdate({
              status: event.target.value as
                | "draft"
                | "completed"
                | "needs_revision"
                | "needs_supplement"
                | "needs_logic_check",
            })
          }
        >
          <option value="draft">草稿</option>
          <option value="completed">已完成</option>
          <option value="needs_revision">需修改</option>
          <option value="needs_supplement">待补充</option>
          <option value="needs_logic_check">待检查逻辑</option>
        </select>
      </label>
      <label>
        <input
          aria-label="是否起始场景"
          type="checkbox"
          checked={scene.isStartScene}
          onChange={(event) => onUpdate({ isStartScene: event.target.checked })}
        />
        是否起始场景
      </label>
      <label>
        <input
          aria-label="是否结局场景"
          type="checkbox"
          checked={scene.isEndingScene}
          onChange={(event) =>
            onUpdate({ isEndingScene: event.target.checked })
          }
        />
        是否结局场景
      </label>
    </article>
  );
}
