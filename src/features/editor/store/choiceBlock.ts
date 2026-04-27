export interface ChoiceBlockMeta {
  label: string;
  targetSceneId: string | null;
  effectVariableId: string | null;
  effectValue: number;
}

export function parseChoiceBlockMeta(metaJson: string | null): ChoiceBlockMeta {
  if (!metaJson) {
    return {
      label: "",
      targetSceneId: null,
      effectVariableId: null,
      effectValue: 0,
    };
  }

  try {
    const parsed = JSON.parse(metaJson) as Partial<ChoiceBlockMeta>;

    return {
      label: typeof parsed.label === "string" ? parsed.label : "",
      targetSceneId:
        typeof parsed.targetSceneId === "string" ? parsed.targetSceneId : null,
      effectVariableId:
        typeof parsed.effectVariableId === "string"
          ? parsed.effectVariableId
          : null,
      effectValue:
        typeof parsed.effectValue === "number" ? parsed.effectValue : 0,
    };
  } catch {
    return {
      label: "",
      targetSceneId: null,
      effectVariableId: null,
      effectValue: 0,
    };
  }
}

export function stringifyChoiceBlockMeta(input: ChoiceBlockMeta) {
  return JSON.stringify({
    label: input.label,
    targetSceneId: input.targetSceneId,
    effectVariableId: input.effectVariableId,
    effectValue: input.effectValue,
  });
}

export function clearChoiceBlockTargetSceneId(
  metaJson: string | null,
  targetSceneId: string,
) {
  if (!metaJson) {
    return metaJson;
  }

  const parsed = parseChoiceBlockMeta(metaJson);
  if (parsed.targetSceneId !== targetSceneId) {
    return metaJson;
  }

  return stringifyChoiceBlockMeta({
    ...parsed,
    targetSceneId: null,
  });
}

export function clearChoiceBlockEffectVariableId(
  metaJson: string | null,
  variableId: string,
) {
  if (!metaJson) {
    return metaJson;
  }

  const parsed = parseChoiceBlockMeta(metaJson);
  if (parsed.effectVariableId !== variableId) {
    return metaJson;
  }

  return stringifyChoiceBlockMeta({
    ...parsed,
    effectVariableId: null,
  });
}
