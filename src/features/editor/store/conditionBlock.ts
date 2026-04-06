import type { ConditionOperator } from "../../../lib/domain/variable";

export interface ConditionBlockItem {
  variableId: string | null;
  operator: ConditionOperator;
  compareValue: number;
}

export interface ConditionBlockMeta {
  conditions: ConditionBlockItem[];
}

export function createDefaultConditionItem(): ConditionBlockItem {
  return {
    variableId: null,
    operator: "isTrue",
    compareValue: 1,
  };
}

export function createDefaultConditionBlockMeta(): ConditionBlockMeta {
  return {
    conditions: [createDefaultConditionItem()],
  };
}

function normalizeConditionItem(
  input?: Partial<ConditionBlockItem> | null,
): ConditionBlockItem {
  return {
    variableId: typeof input?.variableId === "string" ? input.variableId : null,
    operator: input?.operator === "gte" ? "gte" : "isTrue",
    compareValue:
      typeof input?.compareValue === "number" ? input.compareValue : 1,
  };
}

export function parseConditionBlockMeta(
  metaJson: string | null,
): ConditionBlockMeta {
  if (!metaJson) {
    return createDefaultConditionBlockMeta();
  }

  try {
    const parsed = JSON.parse(metaJson) as Record<string, unknown>;

    if (Array.isArray(parsed.conditions)) {
      return {
        conditions: parsed.conditions.map((item) =>
          normalizeConditionItem(item as Partial<ConditionBlockItem>),
        ),
      };
    }

    return {
      conditions: [normalizeConditionItem(parsed as Partial<ConditionBlockItem>)],
    };
  } catch {
    return createDefaultConditionBlockMeta();
  }
}

export function stringifyConditionBlockMeta(input: ConditionBlockMeta) {
  return JSON.stringify({
    conditions: input.conditions.map((item) => normalizeConditionItem(item)),
  });
}

export function clearConditionBlockVariableId(
  metaJson: string | null,
  variableId: string,
) {
  if (!metaJson) {
    return metaJson;
  }

  const parsed = parseConditionBlockMeta(metaJson);
  let changed = false;

  const conditions = parsed.conditions.map((item) => {
    if (item.variableId !== variableId) {
      return item;
    }

    changed = true;

    return {
      ...item,
      variableId: null,
    };
  });

  if (!changed) {
    return metaJson;
  }

  return stringifyConditionBlockMeta({
    conditions,
  });
}
