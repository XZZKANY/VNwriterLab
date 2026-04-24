import type {
  EditorHydrationSlice,
  EditorSliceCreator,
} from "../editorStore.types";

const initialHydrationState: Pick<
  EditorHydrationSlice,
  "scenes" | "selectedSceneId" | "links" | "variables" | "selectedVariableId"
> = {
  scenes: [],
  selectedSceneId: null,
  links: [],
  variables: [],
  selectedVariableId: null,
};

export const createEditorHydrationSlice: EditorSliceCreator<
  EditorHydrationSlice
> = (set) => ({
  ...initialHydrationState,
  async hydrateScenes(_projectId) {},
  async hydrateVariables(_projectId) {},
  resetEditor() {
    set({ ...initialHydrationState });
  },
});
