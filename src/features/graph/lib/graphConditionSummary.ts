import type { SceneBlock } from "@/lib/domain/block";
import type { Scene } from "@/lib/domain/scene";
import type { ProjectVariable } from "@/lib/domain/variable";
import { parseConditionBlockMeta } from "@/features/editor/store/conditionBlock";

/**
 * 把一个条件块的 metaJson 渲染为人类可读的中文摘要。
 * 形如 "拥有钥匙 为真"、"勇气 ≥ 5"，组合时用 "；" 连接，
 * 当 logicMode === "any" 时整体加 "任一满足：" 前缀。
 */
export function formatConditionSummary(
  block: SceneBlock,
  variablesById: Map<string, ProjectVariable>,
) {
  const condition = parseConditionBlockMeta(block.metaJson);
  if (condition.conditions.length === 0) {
    return "无条件";
  }

  const content = condition.conditions
    .map((item) => {
      const variable = item.variableId
        ? (variablesById.get(item.variableId) ?? null)
        : null;
      const variableName =
        variable?.name ?? (item.variableId ? "已删除变量" : "未选择变量");

      if (item.operator === "gte") {
        return `${variableName} ≥ ${item.compareValue}`;
      }

      return `${variableName} 为真`;
    })
    .join("；");

  return condition.logicMode === "any" ? `任一满足：${content}` : content;
}

/**
 * 在场景内向上回溯，从 sourceBlockId（一般是某个选项块）开始
 * 向前连续收集相邻的条件块，返回按 sortOrder 升序排列的列表。
 * 一旦遇到非条件块就停止收集。
 */
export function collectConditionBlocks(
  scene: Scene,
  sourceBlockId: string | null,
) {
  if (!sourceBlockId) {
    return [];
  }

  const sortedBlocks = [...scene.blocks].sort(
    (left, right) => left.sortOrder - right.sortOrder,
  );
  const sourceBlockIndex = sortedBlocks.findIndex(
    (block) => block.id === sourceBlockId,
  );

  if (sourceBlockIndex <= 0) {
    return [];
  }

  const conditionBlocks: SceneBlock[] = [];
  for (let index = sourceBlockIndex - 1; index >= 0; index -= 1) {
    const currentBlock = sortedBlocks[index];
    if (currentBlock?.blockType !== "condition") {
      break;
    }

    conditionBlocks.unshift(currentBlock);
  }

  return conditionBlocks;
}
