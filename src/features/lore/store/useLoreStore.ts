import { create } from "zustand";
import {
  createEmptyLoreEntry,
  type LoreCategory,
  type LoreEntry,
} from "../../../lib/domain/lore";
import { getReferenceRepository } from "../../../lib/repositories/referenceRepositoryRuntime";
import { useAutoSaveStore } from "../../../lib/store/useAutoSaveStore";

interface LoreState {
  entries: LoreEntry[];
  selectedLoreId: string | null;
  hydrateLoreEntries: (projectId: string) => Promise<void>;
  createLoreEntry: (projectId: string) => LoreEntry | null;
  selectLoreEntry: (entryId: string) => void;
  updateLoreEntry: (
    entryId: string,
    input: Partial<Pick<LoreEntry, "name" | "category" | "description" | "tags">>,
  ) => void;
  resetLoreEntries: () => void;
}

const initialState = {
  entries: [] as LoreEntry[],
  selectedLoreId: null as string | null,
};

export const useLoreStore = create<LoreState>()((set, get) => ({
  ...initialState,
  async hydrateLoreEntries(projectId) {
    const trimmedProjectId = projectId.trim();
    if (!trimmedProjectId) {
      useAutoSaveStore.getState().markHydrated(false);
      return;
    }

    const entries = await getReferenceRepository().listLoreEntries(trimmedProjectId);
    const currentSelectedLoreId = get().selectedLoreId;
    const nextSelectedLoreId =
      currentSelectedLoreId &&
      entries.some((entry) => entry.id === currentSelectedLoreId)
        ? currentSelectedLoreId
        : entries[0]?.id ?? null;

    set({
      entries,
      selectedLoreId: nextSelectedLoreId,
    });

    useAutoSaveStore.getState().markHydrated(entries.length > 0);
  },
  createLoreEntry(projectId) {
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
    void getReferenceRepository().saveLoreEntry(nextEntry);

    return nextEntry;
  },
  selectLoreEntry(entryId) {
    set({ selectedLoreId: entryId });
  },
  updateLoreEntry(entryId, input) {
    const targetEntry = get().entries.find((entry) => entry.id === entryId);
    if (!targetEntry) {
      return;
    }

    useAutoSaveStore.getState().markDirty();

    const nextEntries = get().entries.map((entry) =>
      entry.id === entryId
        ? {
            ...entry,
            ...input,
            category: (input.category as LoreCategory | undefined) ?? entry.category,
          }
        : entry,
    );
    const nextEntry = nextEntries.find((entry) => entry.id === entryId);

    set({
      entries: nextEntries,
    });

    useAutoSaveStore.getState().markSaved();
    if (nextEntry) {
      void getReferenceRepository().saveLoreEntry(nextEntry);
    }
  },
  resetLoreEntries() {
    set(initialState);
  },
}));
