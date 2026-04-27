import { describe, expect, it } from "vitest";
import type { ProjectStoreState } from "./projectStore.types";
import { createProjectHydrationSlice } from "./slices/projectHydrationSlice";
import { createProjectLifecycleSlice } from "./slices/projectLifecycleSlice";
import { createProjectRouteSlice } from "./slices/projectRouteSlice";
import { createProjectSceneSlice } from "./slices/projectSceneSlice";

type ProjectSliceSet = Parameters<typeof createProjectHydrationSlice>[0];
type ProjectSliceGet = Parameters<typeof createProjectHydrationSlice>[1];
type ProjectSliceStore = Parameters<typeof createProjectHydrationSlice>[2];

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

function composeProjectSlices(): ProjectStoreState {
  let state = {} as ProjectStoreState;

  const setState: ProjectSliceSet = (partial, replace) => {
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
  const getState: ProjectSliceGet = () => state;
  const store = {} as ProjectSliceStore;

  state = {
    ...createProjectHydrationSlice(setState, getState, store),
    ...createProjectLifecycleSlice(setState, getState, store),
    ...createProjectRouteSlice(setState, getState, store),
    ...createProjectSceneSlice(setState, getState, store),
  };

  return state;
}

describe("useProjectStore slice composition", () => {
  it("组合 4 个 project slice 后包含约定的状态和动作键", () => {
    const composedState = composeProjectSlices();

    expect(composedState).toHaveProperty("currentProject");
    expect(composedState.currentProject).toBeNull();

    for (const key of functionKeys) {
      expect(composedState).toHaveProperty(key);
      expect(typeof composedState[key]).toBe("function");
    }
  });
});
