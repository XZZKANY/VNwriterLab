import type { ProjectVariable } from "@/lib/domain/variable";
import type { EditorVariableUpdateInput } from "../store/editorStore.types";

interface VariablePanelProps {
  projectId: string;
  variables: ProjectVariable[];
  selectedVariable: ProjectVariable | null;
  onCreateVariable: () => void;
  onSelectVariable: (variableId: string) => void;
  onUpdateVariable: (
    variableId: string,
    input: EditorVariableUpdateInput,
  ) => void;
  onDeleteVariable: (variableId: string) => void;
}

export function VariablePanel({
  projectId,
  variables,
  selectedVariable,
  onCreateVariable,
  onSelectVariable,
  onUpdateVariable,
  onDeleteVariable,
}: VariablePanelProps) {
  return (
    <div
      className="layout-split layout-split--narrow"
      style={{ marginBottom: 16 }}
      data-project-id={projectId}
    >
      <aside>
        <h3>变量</h3>
        <button type="button" onClick={onCreateVariable}>
          新增变量
        </button>
        <ul>
          {variables.map((variable) => (
            <li key={variable.id}>
              <button
                type="button"
                aria-pressed={variable.id === selectedVariable?.id}
                onClick={() => onSelectVariable(variable.id)}
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
                  onUpdateVariable(selectedVariable.id, {
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
                  onUpdateVariable(selectedVariable.id, {
                    variableType:
                      event.target.value === "number" ? "number" : "flag",
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
                    onUpdateVariable(selectedVariable.id, {
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
                    onUpdateVariable(selectedVariable.id, {
                      defaultValue: Number(event.target.value) || 0,
                    })
                  }
                />
              </label>
            )}
            <button
              type="button"
              onClick={() => onDeleteVariable(selectedVariable.id)}
            >
              删除变量
            </button>
          </>
        ) : (
          <p>点击“新增变量”开始配置基础标记。</p>
        )}
      </article>
    </div>
  );
}
