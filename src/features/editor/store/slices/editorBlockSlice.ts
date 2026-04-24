import type { EditorBlockSlice, EditorSliceCreator } from "../editorStore.types";

export const createEditorBlockSlice: EditorSliceCreator<EditorBlockSlice> = () => ({
  addBlock(_blockType) {},
  deleteBlock(_sceneId, _blockId) {},
  moveBlockUp(_sceneId, _blockId) {},
  moveBlockDown(_sceneId, _blockId) {},
  updateBlockContent(_sceneId, _blockId, _contentText) {},
  updateConditionBlock(_sceneId, _blockId, _input) {},
  updateNoteBlock(_sceneId, _blockId, _input) {},
});
