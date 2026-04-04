import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AutoSaveState {
  lastSavedAt: string | null;
  hasPendingChanges: boolean;
  hasHydrated: boolean;
  hasRestoredDraft: boolean;
  markDirty: () => void;
  markSaved: (savedAt?: string) => void;
  markHydrated: (restored?: boolean) => void;
  reset: () => void;
}

export const AUTO_SAVE_STORAGE_KEY = "vn-writer-lab.autosave-store";

const initialState = {
  lastSavedAt: null,
  hasPendingChanges: false,
  hasHydrated: false,
  hasRestoredDraft: false,
};

export const useAutoSaveStore = create<AutoSaveState>()(
  persist(
    (set) => ({
      ...initialState,
      markDirty: () => set({ hasPendingChanges: true }),
      markSaved: (savedAt) =>
        set({
          lastSavedAt: savedAt ?? new Date().toISOString(),
          hasPendingChanges: false,
        }),
      markHydrated: (restored = false) =>
        set((state) => ({
          hasHydrated: true,
          hasRestoredDraft: state.hasRestoredDraft || restored,
        })),
      reset: () => set(initialState),
    }),
    {
      name: AUTO_SAVE_STORAGE_KEY,
      partialize: (state) => ({
        lastSavedAt: state.lastSavedAt,
      }),
      onRehydrateStorage: () => (state) => {
        state?.markHydrated();
      },
    },
  ),
);
