import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  createEmptyLoreEntry,
  type LoreCategory,
  type LoreEntry,
} from "../../../lib/domain/lore";
import { useAutoSaveStore } from "../../../lib/store/useAutoSaveStore";

interface LoreState {
  entries: LoreEntry[];
  selectedLoreId: string | null;
  createLoreEntry: (projectId: string) => LoreEntry | null;
  selectLoreEntry: (entryId: string) => void;
  updateLoreEntry: (
    entryId: string,
    input: Partial<Pick<LoreEntry, "name" | "category" | "description" | "tags">>,
  ) => void;
  resetLoreEntries: () => void;
}

export const LORE_STORAGE_KEY = "vn-writer-lab.lore-store";

const initialState = {
  entries: [] as LoreEntry[],
  selectedLoreId: null as string | null,
};

export const useLoreStore = create<LoreState>()(
  persist(
    (set, get) => ({
      ...initialState,
      createLoreEntry: (projectId) => {
        const trimmedProjectId = projectId.trim();
        if (!trimmedProjectId) {
          return null;
        }

        useAutoSaveStore.getState().markDirty();

        const nextEntry = createEmptyLoreEntry({
          projectId: trimmedProjectId,
          index: get().entries.filter((entry) => entry.projectId === trimmedProjectId)
            .length,
        });

        set({
          entries: [...get().entries, nextEntry],
          selectedLoreId: nextEntry.id,
        });

        useAutoSaveStore.getState().markSaved();

        return nextEntry;
      },
      selectLoreEntry: (entryId) => {
        set({ selectedLoreId: entryId });
      },
      updateLoreEntry: (entryId, input) => {
        const targetEntry = get().entries.find((entry) => entry.id === entryId);
        if (!targetEntry) {
          return;
        }

        useAutoSaveStore.getState().markDirty();

        set({
          entries: get().entries.map((entry) =>
            entry.id === entryId
              ? {
                  ...entry,
                  ...input,
                  category: (input.category as LoreCategory | undefined) ?? entry.category,
                }
              : entry,
          ),
        });

        useAutoSaveStore.getState().markSaved();
      },
      resetLoreEntries: () => set(initialState),
    }),
    {
      name: LORE_STORAGE_KEY,
      partialize: (state) => ({
        entries: state.entries,
        selectedLoreId: state.selectedLoreId,
      }),
      onRehydrateStorage: () => {
        const restored = localStorage.getItem(LORE_STORAGE_KEY) !== null;

        return () => {
          useAutoSaveStore.getState().markHydrated(restored);
        };
      },
    },
  ),
);
