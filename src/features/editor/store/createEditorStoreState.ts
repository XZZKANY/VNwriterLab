import type {
  EditorHydrationSlice,
  EditorSceneSlice,
  EditorVariableSlice,
} from "./editorStore.types";
import { createEditorHydrationSlice } from "./slices/editorHydrationSlice";
import { createEditorSceneSlice } from "./slices/editorSceneSlice";
import { createEditorVariableSlice } from "./slices/editorVariableSlice";

type CreateEditorStoreStateArgs = Parameters<typeof createEditorHydrationSlice>;

export const createEditorStoreState = (
  ...args: CreateEditorStoreStateArgs
): EditorHydrationSlice & EditorSceneSlice & EditorVariableSlice => ({
  ...createEditorHydrationSlice(...args),
  ...createEditorSceneSlice(...args),
  ...createEditorVariableSlice(...args),
});
