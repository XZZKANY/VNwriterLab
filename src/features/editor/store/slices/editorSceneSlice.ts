import type { EditorSceneSlice, EditorSliceCreator } from "../editorStore.types";

const initialSceneState: Pick<EditorSceneSlice, "scenes" | "selectedSceneId"> = {
  scenes: [],
  selectedSceneId: null,
};

export const createEditorSceneSlice: EditorSliceCreator<EditorSceneSlice> = () => ({
  ...initialSceneState,
  createScene(_input) {},
  importScene(_scene) {},
  selectScene(_sceneId) {},
  updateScene(_sceneId, _input) {},
  deleteScene(_sceneId) {},
});
