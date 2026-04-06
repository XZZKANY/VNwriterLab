export type VariableType = "flag" | "number";

export type ConditionOperator = "isTrue" | "gte";

export interface ProjectVariable {
  id: string;
  projectId: string;
  name: string;
  variableType: VariableType;
  defaultValue: number;
}

export function createEmptyVariable(input: {
  projectId: string;
  index: number;
}): ProjectVariable {
  return {
    id: crypto.randomUUID(),
    projectId: input.projectId,
    name: `变量 ${input.index + 1}`,
    variableType: "flag",
    defaultValue: 0,
  };
}
