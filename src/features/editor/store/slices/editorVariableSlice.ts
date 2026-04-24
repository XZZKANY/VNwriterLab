import type {
  EditorSliceCreator,
  EditorVariableSlice,
} from "../editorStore.types";

const initialVariableState: Pick<
  EditorVariableSlice,
  "variables" | "selectedVariableId"
> = {
  variables: [],
  selectedVariableId: null,
};

export const createEditorVariableSlice: EditorSliceCreator<
  EditorVariableSlice
> = () => ({
  ...initialVariableState,
  createVariable(_projectId) {
    return null;
  },
  selectVariable(_variableId) {},
  deleteVariable(_variableId) {},
  updateVariable(_variableId, _input) {},
});
