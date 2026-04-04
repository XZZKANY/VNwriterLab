import { create } from "zustand";

interface AutoSaveState {
  lastSavedAt: string | null;
  markSaved: () => void;
}

export const useAutoSaveStore = create<AutoSaveState>((set) => ({
  lastSavedAt: null,
  markSaved: () => set({ lastSavedAt: new Date().toISOString() }),
}));
