import type { ProjectStoreState } from "./projectStore.types";
import { createProjectHydrationSlice } from "./slices/projectHydrationSlice";
import { createProjectLifecycleSlice } from "./slices/projectLifecycleSlice";
import { createProjectRouteSlice } from "./slices/projectRouteSlice";
import { createProjectSceneSlice } from "./slices/projectSceneSlice";

type CreateProjectStoreStateArgs = Parameters<typeof createProjectHydrationSlice>;

export const createProjectStoreState = (
  ...args: CreateProjectStoreStateArgs
): ProjectStoreState => ({
  ...createProjectHydrationSlice(...args),
  ...createProjectLifecycleSlice(...args),
  ...createProjectRouteSlice(...args),
  ...createProjectSceneSlice(...args),
});
