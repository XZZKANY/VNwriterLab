import { describe, expect, it } from "vitest";
import { createEditorStoreState } from "./createEditorStoreState";

type EditorStoreBaseState = ReturnType<typeof createEditorStoreState>;
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
] as const;

function composeEditorStoreState() {
  let state = {} as EditorStoreBaseState;

  const setState: EditorStoreSet = (partial, replace) => {
    const partialState =
      typeof partial === "function"
        ? partial(state as never)
        : (partial as Partial<EditorStoreBaseState>);

    if (replace) {
      state = partialState as EditorStoreBaseState;
      return;
    }

    state = {
      ...state,
      ...partialState,
    };
  };
  const getState: EditorStoreGet = () => state as never;
  const store = {} as EditorStoreApi;

  state = createEditorStoreState(setState, getState, store);

  return state;
}

describe("createEditorStoreState", () => {
  it("只组合 hydration / scene / variable 三个基础 slice", () => {
    const composedState = composeEditorStoreState();

    expect(composedState.scenes).toEqual([]);
    expect(composedState.selectedSceneId).toBeNull();
    expect(composedState.variables).toEqual([]);
    expect(composedState.selectedVariableId).toBeNull();
    expect(composedState).not.toHaveProperty("links");

    for (const key of functionKeys) {
      expect(composedState).toHaveProperty(key);
      expect(typeof composedState[key]).toBe("function");
    }
  });
});
