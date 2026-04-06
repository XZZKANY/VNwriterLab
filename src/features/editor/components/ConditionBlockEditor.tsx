import type { ProjectVariable } from "../../../lib/domain/variable";
import {
  createDefaultConditionItem,
  type ConditionBlockItem,
  type ConditionBlockMeta,
} from "../store/conditionBlock";

interface ConditionBlockEditorProps {
  condition: ConditionBlockMeta;
  variables: ProjectVariable[];
  onChange: (input: ConditionBlockMeta) => void;
}

export function ConditionBlockEditor({
  condition,
  variables,
  onChange,
}: ConditionBlockEditorProps) {
  function updateCondition(index: number, input: Partial<ConditionBlockItem>) {
    onChange({
      ...condition,
      conditions: condition.conditions.map((item, currentIndex) =>
        currentIndex === index
          ? {
              variableId:
                input.variableId === undefined ? item.variableId : input.variableId,
              operator: input.operator ?? item.operator,
              compareValue:
                typeof input.compareValue === "number"
                  ? input.compareValue
                  : item.compareValue,
            }
          : item,
      ),
    });
  }

  function addCondition() {
    onChange({
      ...condition,
      conditions: [...condition.conditions, createDefaultConditionItem()],
    });
  }

  function removeCondition(index: number) {
    onChange({
      ...condition,
      conditions: condition.conditions.filter(
        (_item, currentIndex) => currentIndex !== index,
      ),
    });
  }

  return (
    <fieldset>
      <legend>条件列表</legend>
      {condition.conditions.length > 0 ? (
        condition.conditions.map((item, index) => (
          <fieldset key={index}>
            <legend>条件项 {index + 1}</legend>
            <label>
              条件变量
              <select
                aria-label="条件变量"
                value={item.variableId ?? ""}
                onChange={(event) =>
                  updateCondition(index, {
                    variableId: event.target.value || null,
                  })
                }
              >
                <option value="">请选择变量</option>
                {variables.map((variable) => (
                  <option key={variable.id} value={variable.id}>
                    {variable.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              条件运算
              <select
                aria-label="条件运算"
                value={item.operator}
                onChange={(event) =>
                  updateCondition(index, {
                    operator: event.target.value === "gte" ? "gte" : "isTrue",
                  })
                }
              >
                <option value="isTrue">标记为真</option>
                <option value="gte">大于等于</option>
              </select>
            </label>
            <label>
              比较值
              <input
                aria-label="比较值"
                type="number"
                value={item.compareValue}
                onChange={(event) =>
                  updateCondition(index, {
                    compareValue: Number(event.target.value) || 0,
                  })
                }
              />
            </label>
            <button type="button" onClick={() => removeCondition(index)}>
              删除此项
            </button>
          </fieldset>
        ))
      ) : (
        <p>暂无条件项</p>
      )}
      <button type="button" onClick={addCondition}>
        添加条件项
      </button>
    </fieldset>
  );
}
