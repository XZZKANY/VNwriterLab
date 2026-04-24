import type { EditorSceneSlice, EditorSliceCreator } from "../editorStore.types";

export const createEditorSceneSlice: EditorSliceCreator<EditorSceneSlice> = () => ({
  createScene(_input) {},
  importScene(_scene) {},
  selectScene(_sceneId) {},
  updateScene(_sceneId, _input) {},
  deleteScene(_sceneId) {},
});
