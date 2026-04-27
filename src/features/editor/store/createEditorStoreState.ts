import type {
  EditorBlockSlice,
  EditorChoiceLinkSlice,
  EditorHydrationSlice,
  EditorSceneSlice,
  EditorStoreState,
  EditorVariableSlice,
} from "./editorStore.types";
import { createEditorBlockSlice } from "./slices/editorBlockSlice";
import { createEditorChoiceLinkSlice } from "./slices/editorChoiceLinkSlice";
import { createEditorHydrationSlice } from "./slices/editorHydrationSlice";
import { createEditorSceneSlice } from "./slices/editorSceneSlice";
import { createEditorVariableSlice } from "./slices/editorVariableSlice";

type CreateEditorStoreStateArgs = Parameters<typeof createEditorHydrationSlice>;

export const createEditorStoreState = (
  ...args: CreateEditorStoreStateArgs
): EditorHydrationSlice &
  EditorSceneSlice &
  EditorVariableSlice &
  EditorBlockSlice &
  EditorChoiceLinkSlice &
  EditorStoreState => ({
  ...createEditorBlockSlice(...args),
  ...createEditorChoiceLinkSlice(...args),
  ...createEditorHydrationSlice(...args),
  ...createEditorSceneSlice(...args),
  ...createEditorVariableSlice(...args),
});
