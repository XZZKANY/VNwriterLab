export type VariableType = "flag" | "number";

export interface ProjectVariable {
  id: string;
  projectId: string;
  name: string;
  variableType: VariableType;
  defaultValue: number;
}
