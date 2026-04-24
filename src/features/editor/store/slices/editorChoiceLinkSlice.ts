import type {
  EditorChoiceLinkSlice,
  EditorSliceCreator,
} from "../editorStore.types";

export const createEditorChoiceLinkSlice: EditorSliceCreator<
  EditorChoiceLinkSlice
> = () => ({
  updateChoiceBlock(_sceneId, _blockId, _input) {},
});
