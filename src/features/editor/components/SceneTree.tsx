import type { Scene } from "../../../lib/domain/scene";

interface SceneTreeProps {
  scenes: Scene[];
  onCreateScene: () => void;
}

export function SceneTree({ scenes, onCreateScene }: SceneTreeProps) {
  return (
    <aside>
      <button type="button" onClick={onCreateScene}>
        新建场景
      </button>
      <ul>
        {scenes.map((scene) => (
          <li key={scene.id}>{scene.title}</li>
        ))}
      </ul>
    </aside>
  );
}
