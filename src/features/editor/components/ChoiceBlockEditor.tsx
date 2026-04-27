import type { Scene } from "@/lib/domain/scene";
import type { ProjectVariable } from "@/lib/domain/variable";

interface ChoiceBlockEditorProps {
  label: string;
  targetSceneId: string | null;
  effectVariableId: string | null;
  effectValue: number;
  currentSceneId: string;
  scenes: Scene[];
  variables: ProjectVariable[];
  onChange: (input: {
    label: string;
    targetSceneId: string | null;
    effectVariableId: string | null;
    effectValue: number;
  }) => void;
}

export function ChoiceBlockEditor({
  label,
  targetSceneId,
  effectVariableId,
  effectValue,
  currentSceneId,
  scenes,
  variables,
  onChange,
}: ChoiceBlockEditorProps) {
  const availableScenes = scenes.filter((scene) => scene.id !== currentSceneId);

  return (
    <fieldset>
      <legend>选项块</legend>
      <label>
        选项文案
        <input
          aria-label="选项文案"
          value={label}
          onChange={(event) =>
            onChange({
              label: event.target.value,
              targetSceneId,
              effectVariableId,
              effectValue,
            })
          }
        />
      </label>
      <label>
        跳转场景
        <select
          aria-label="跳转场景"
          value={targetSceneId ?? ""}
          onChange={(event) =>
            onChange({
              label,
              targetSceneId: event.target.value || null,
              effectVariableId,
              effectValue,
            })
          }
        >
          <option value="">请选择场景</option>
          {availableScenes.map((scene) => (
            <option key={scene.id} value={scene.id}>
              {scene.title}
            </option>
          ))}
        </select>
      </label>
      <label>
        修改变量
        <select
          aria-label="修改变量"
          value={effectVariableId ?? ""}
          onChange={(event) =>
            onChange({
              label,
              targetSceneId,
              effectVariableId: event.target.value || null,
              effectValue,
            })
          }
        >
          <option value="">不修改变量</option>
          {variables.map((variable) => (
            <option key={variable.id} value={variable.id}>
              {variable.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        副作用值
        <input
          aria-label="副作用值"
          type="number"
          value={effectValue}
          onChange={(event) =>
            onChange({
              label,
              targetSceneId,
              effectVariableId,
              effectValue: Number(event.target.value) || 0,
            })
          }
        />
      </label>
    </fieldset>
  );
}
