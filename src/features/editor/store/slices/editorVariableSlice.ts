import type {
  EditorSliceCreator,
  EditorVariableSlice,
} from "../editorStore.types";

export const createEditorVariableSlice: EditorSliceCreator<
  EditorVariableSlice
> = () => ({
  createVariable(_projectId) {
    return null;
  },
  selectVariable(_variableId) {},
  deleteVariable(_variableId) {},
  updateVariable(_variableId, _input) {},
});
