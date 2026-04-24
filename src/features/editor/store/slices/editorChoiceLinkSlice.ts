import type {
  EditorChoiceLinkSlice,
  EditorSliceCreator,
} from "../editorStore.types";

const initialChoiceLinkState: Pick<EditorChoiceLinkSlice, "links"> = {
  links: [],
};

export const createEditorChoiceLinkSlice: EditorSliceCreator<
  EditorChoiceLinkSlice
> = () => ({
  ...initialChoiceLinkState,
  updateChoiceBlock(_sceneId, _blockId, _input) {},
});
