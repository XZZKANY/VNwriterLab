import { create } from "zustand";
import { createEmptyProject, type Project } from "../../../lib/domain/project";

interface ProjectState {
  currentProject: Project | null;
  createProject: (name: string, summary: string) => void;
}

export const useProjectStore = create<ProjectState>((set) => ({
  currentProject: null,
  createProject: (name, summary) =>
    set({
      currentProject: createEmptyProject(name, summary),
    }),
}));
