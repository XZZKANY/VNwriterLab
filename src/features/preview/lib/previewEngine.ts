import type { SceneBlock } from "../../../lib/domain/block";
import type { ProjectVariable } from "../../../lib/domain/variable";
import { parseConditionBlockMeta } from "../../editor/store/conditionBlock";
import { parseChoiceBlockMeta } from "../../editor/store/choiceBlock";
import type { SceneLink } from "../../editor/store/linkUtils";

function evaluateConditionBlock(
  conditionBlock: SceneBlock,
  variables: ProjectVariable[],
): boolean {
  const condition = parseConditionBlockMeta(conditionBlock.metaJson);

  if (condition.conditions.length === 0) {
    return false;
  }

  return condition.conditions.every((item) => {
    const variable = variables.find((candidate) => candidate.id === item.variableId);
    if (!variable) {
      return false;
    }

    if (item.operator === "gte") {
      return variable.defaultValue >= item.compareValue;
    }

    return variable.defaultValue > 0;
  });
}

export function canEnterScene(
  blocks: SceneBlock[],
  variables: ProjectVariable[],
): boolean {
  let hasSeenNonConditionBlock = false;

  for (const block of [...blocks].sort(
    (left, right) => left.sortOrder - right.sortOrder,
  )) {
    if (block.blockType !== "condition") {
      hasSeenNonConditionBlock = true;
      continue;
    }

    if (hasSeenNonConditionBlock) {
      return true;
    }

    if (!evaluateConditionBlock(block, variables)) {
      return false;
    }
  }

  return true;
}

export function resolveVisibleBlocks(
  blocks: SceneBlock[],
  variables: ProjectVariable[],
): SceneBlock[] {
  const sortedBlocks = [...blocks].sort(
    (left, right) => left.sortOrder - right.sortOrder,
  );
  const visibleBlocks: SceneBlock[] = [];

  if (!canEnterScene(sortedBlocks, variables)) {
    return visibleBlocks;
  }

  for (let index = 0; index < sortedBlocks.length; index += 1) {
    const currentBlock = sortedBlocks[index];
    if (!currentBlock) {
      continue;
    }

    if (currentBlock.blockType === "condition") {
      const nextBlock = sortedBlocks[index + 1];

      if (
        nextBlock?.blockType === "choice" &&
        !evaluateConditionBlock(currentBlock, variables)
      ) {
        index += 1;
      }

      continue;
    }

    visibleBlocks.push(currentBlock);
  }

  return visibleBlocks;
}

export function resolveNextSceneId(
  links: SceneLink[],
  currentSceneId: string,
  selectedLabel: string,
) {
  const nextLink = links.find(
    (link) =>
      link.fromSceneId === currentSceneId &&
      link.linkType === "choice" &&
      link.label === selectedLabel,
  );

  return nextLink?.toSceneId ?? null;
}

export function applyChoiceEffect(
  variables: ProjectVariable[],
  choiceMetaJson: string | null,
): ProjectVariable[] {
  const choice = parseChoiceBlockMeta(choiceMetaJson);
  if (!choice.effectVariableId) {
    return variables;
  }

  return variables.map((variable) =>
    variable.id === choice.effectVariableId
      ? {
          ...variable,
          defaultValue:
            variable.variableType === "flag"
              ? choice.effectValue > 0
                ? 1
                : 0
              : choice.effectValue,
        }
      : variable,
  );
}
