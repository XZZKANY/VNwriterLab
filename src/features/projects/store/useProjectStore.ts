import { create } from "zustand";
import { createProjectStoreState } from "./createProjectStoreState";
import type { ProjectStoreState } from "./projectStore.types";

export const useProjectStore = create<ProjectStoreState>()((...args) =>
  createProjectStoreState(...args),
);
