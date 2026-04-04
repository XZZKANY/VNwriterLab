import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createEmptyProject, type Project } from "../../../lib/domain/project";
import { useAutoSaveStore } from "../../../lib/store/useAutoSaveStore";

interface ProjectState {
  currentProject: Project | null;
  createProject: (name: string, summary: string) => void;
  resetProject: () => void;
}

export const PROJECT_STORAGE_KEY = "vn-writer-lab.project-store";

const initialState = {
  currentProject: null as Project | null,
};

export const useProjectStore = create<ProjectState>()(
  persist(
    (set) => ({
      ...initialState,
      createProject: (name, summary) => {
        useAutoSaveStore.getState().markDirty();

        set({
          currentProject: createEmptyProject(name, summary),
        });

        useAutoSaveStore.getState().markSaved();
      },
      resetProject: () => set(initialState),
    }),
    {
      name: PROJECT_STORAGE_KEY,
      partialize: (state) => ({
        currentProject: state.currentProject,
      }),
      onRehydrateStorage: () => {
        const restored = localStorage.getItem(PROJECT_STORAGE_KEY) !== null;

        return () => {
          useAutoSaveStore.getState().markHydrated(restored);
        };
      },
    },
  ),
);
