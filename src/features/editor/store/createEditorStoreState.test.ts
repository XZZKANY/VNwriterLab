import { describe, expect, it } from "vitest";
import { createEditorStoreState } from "./createEditorStoreState";
import type { EditorStoreState } from "./editorStore.types";

type EditorStoreSet = Parameters<typeof createEditorStoreState>[0];
type EditorStoreGet = Parameters<typeof createEditorStoreState>[1];
type EditorStoreApi = Parameters<typeof createEditorStoreState>[2];

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

  state = createEditorStoreState(setState, getState, store);

  return state;
}

describe("createEditorStoreState", () => {
  it("组合 5 个 editor slice 后包含约定的状态和动作键", () => {
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
