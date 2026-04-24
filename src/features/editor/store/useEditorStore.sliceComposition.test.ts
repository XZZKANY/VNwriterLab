import { describe, expect, it } from "vitest";
import type { EditorStoreState } from "./editorStore.types";
import { createEditorBlockSlice } from "./slices/editorBlockSlice";
import { createEditorChoiceLinkSlice } from "./slices/editorChoiceLinkSlice";
import { createEditorHydrationSlice } from "./slices/editorHydrationSlice";
import { createEditorSceneSlice } from "./slices/editorSceneSlice";
import { createEditorVariableSlice } from "./slices/editorVariableSlice";

const editorSliceFactories = [
  createEditorHydrationSlice,
  createEditorSceneSlice,
  createEditorVariableSlice,
  createEditorBlockSlice,
  createEditorChoiceLinkSlice,
] as const;

const functionKeys = [
  "hydrateScenes",
  "hydrateVariables",
  "resetEditor",
  "createScene",
  "importScene",
  "selectScene",
  "updateScene",
  "deleteScene",
  "createVariable",
  "selectVariable",
  "deleteVariable",
  "updateVariable",
  "addBlock",
  "deleteBlock",
  "moveBlockUp",
  "moveBlockDown",
  "updateBlockContent",
  "updateConditionBlock",
  "updateNoteBlock",
  "updateChoiceBlock",
] as const;

type EditorStoreSet = Parameters<typeof createEditorHydrationSlice>[0];
type EditorStoreGet = Parameters<typeof createEditorHydrationSlice>[1];
type EditorStoreApi = Parameters<typeof createEditorHydrationSlice>[2];

function composeEditorStoreState() {
  let state = {} as EditorStoreState;

  const setState: EditorStoreSet = (partial, replace) => {
    const partialState =
      typeof partial === "function"
        ? partial(state)
        : (partial as Partial<EditorStoreState>);

    if (replace) {
      state = partialState as EditorStoreState;
      return;
    }

    state = {
      ...state,
      ...partialState,
    };
  };
  const getState: EditorStoreGet = () => state;
  const store = {} as EditorStoreApi;

  state = {
    ...createEditorHydrationSlice(setState, getState, store),
    ...createEditorSceneSlice(setState, getState, store),
    ...createEditorVariableSlice(setState, getState, store),
    ...createEditorBlockSlice(setState, getState, store),
    ...createEditorChoiceLinkSlice(setState, getState, store),
  };

  return state;
}

describe("useEditorStore slice composition", () => {
  it("导出 5 个 editor slice 工厂且均为函数", () => {
    expect(editorSliceFactories).toHaveLength(5);

    for (const sliceFactory of editorSliceFactories) {
      expect(typeof sliceFactory).toBe("function");
    }
  });

  it("组合 5 个 editor slice 后包含归位后的状态键与动作键", () => {
    const composedState = composeEditorStoreState();

    expect(composedState.scenes).toEqual([]);
    expect(composedState.selectedSceneId).toBeNull();
    expect(composedState.variables).toEqual([]);
    expect(composedState.selectedVariableId).toBeNull();
    expect(composedState.links).toEqual([]);

    for (const key of functionKeys) {
      expect(composedState).toHaveProperty(key);
      expect(typeof composedState[key]).toBe("function");
    }
  });
});
