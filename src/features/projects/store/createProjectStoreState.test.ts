import { describe, expect, it } from "vitest";
import { createProjectStoreState } from "./createProjectStoreState";
import type { ProjectStoreState } from "./projectStore.types";

type ProjectStoreSet = Parameters<typeof createProjectStoreState>[0];
type ProjectStoreGet = Parameters<typeof createProjectStoreState>[1];
type ProjectStoreApi = Parameters<typeof createProjectStoreState>[2];

const functionKeys = [
  "hydrateLatestProject",
  "createProject",
  "importProject",
  "resetProject",
  "createRoute",
  "renameRoute",
  "createSceneInRoute",
  "updateScene",
  "deleteScene",
  "moveSceneUp",
  "moveSceneDown",
  "moveSceneToRoute",
] as const;

function composeProjectStoreState() {
  let state = {} as ProjectStoreState;

  const setState: ProjectStoreSet = (partial, replace) => {
    const partialState =
      typeof partial === "function"
        ? partial(state)
        : (partial as Partial<ProjectStoreState>);

    if (replace) {
      state = partialState as ProjectStoreState;
      return;
    }

    state = {
      ...state,
      ...partialState,
    };
  };
  const getState: ProjectStoreGet = () => state;
  const store = {} as ProjectStoreApi;

  state = createProjectStoreState(setState, getState, store);

  return state;
}

describe("createProjectStoreState", () => {
  it("组合 4 个 project slice 后包含约定的状态和动作键", () => {
    const composedState = composeProjectStoreState();

    expect(composedState).toHaveProperty("currentProject");
    expect(composedState.currentProject).toBeNull();

    for (const key of functionKeys) {
      expect(composedState).toHaveProperty(key);
      expect(typeof composedState[key]).toBe("function");
    }
  });
});
