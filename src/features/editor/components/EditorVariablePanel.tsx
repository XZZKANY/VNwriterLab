import type { ProjectVariable } from "@/lib/domain/variable";
import type { EditorVariableUpdateInput } from "../store/editorStore.types";
import { VariablePanel } from "./VariablePanel";

interface EditorVariablePanelProps {
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

export function EditorVariablePanel(props: EditorVariablePanelProps) {
  return <VariablePanel {...props} />;
}
