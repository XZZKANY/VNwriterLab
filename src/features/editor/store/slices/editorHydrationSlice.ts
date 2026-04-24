import type {
  EditorHydrationSlice,
  EditorSliceCreator,
} from "../editorStore.types";

export const createEditorHydrationSlice: EditorSliceCreator<
  EditorHydrationSlice
> = () => ({
  async hydrateScenes(_projectId) {},
  async hydrateVariables(_projectId) {},
  resetEditor() {},
});
