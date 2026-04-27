import { beforeEach, describe, expect, it, vi } from "vitest";
import type { LoreEntry } from "@/lib/domain/lore";
import { useAutoSaveStore } from "@/lib/store/useAutoSaveStore";
import {
  resetReferenceRepositoryForTesting,
  setReferenceRepositoryForTesting,
} from "@/lib/repositories/referenceRepositoryRuntime";
import { useLoreStore } from "./useLoreStore";

function createLoreEntry(overrides: Partial<LoreEntry> = {}): LoreEntry {
  return {
    id: "l1",
    projectId: "p1",
    name: "旧校舍",
    category: "location",
    description: "深夜会传来脚步声。",
    tags: [],
    ...overrides,
  };
}

function createFakeReferenceRepository(initialEntries: LoreEntry[] = []) {
  const entries = new Map(initialEntries.map((entry) => [entry.id, entry]));
  const listLoreEntries = vi.fn(async (projectId: string) =>
    [...entries.values()].filter((entry) => entry.projectId === projectId),
  );
  const saveLoreEntry = vi.fn(async (entry: LoreEntry) => {
    entries.set(entry.id, entry);
  });

  return {
    repository: {
      listCharacters: vi.fn(async () => []),
      saveCharacter: vi.fn(async () => undefined),
      listLoreEntries,
      saveLoreEntry,
      listVariables: vi.fn(async () => []),
      saveVariable: vi.fn(async () => undefined),
      saveVariables: vi.fn(async () => undefined),
    },
    listLoreEntries,
    saveLoreEntry,
  };
}

describe("useLoreStore repository", () => {
  beforeEach(() => {
    localStorage.clear();
    useLoreStore.getState().resetLoreEntries();
    useAutoSaveStore.getState().reset();
    resetReferenceRepositoryForTesting();
  });

  it("hydrateLoreEntries 会从 repository 恢复设定并同步选中项", async () => {
    const fake = createFakeReferenceRepository([createLoreEntry()]);
    setReferenceRepositoryForTesting(fake.repository);

    await useLoreStore.getState().hydrateLoreEntries("p1");

    expect(fake.listLoreEntries).toHaveBeenCalledWith("p1");
    expect(useLoreStore.getState().entries[0]?.name).toBe("旧校舍");
    expect(useLoreStore.getState().selectedLoreId).toBe("l1");
    expect(useAutoSaveStore.getState().hasRestoredDraft).toBe(true);
  });

  it("createLoreEntry 与 updateLoreEntry 会通过 repository 保存", async () => {
    const fake = createFakeReferenceRepository();
    setReferenceRepositoryForTesting(fake.repository);

    const created = useLoreStore.getState().createLoreEntry("p1");
    expect(created).not.toBeNull();

    useLoreStore.getState().updateLoreEntry(created!.id, {
      name: "旧校舍",
      description: "深夜会传来脚步声。",
      category: "location",
    });

    expect(fake.saveLoreEntry).toHaveBeenCalled();
    expect(fake.saveLoreEntry).toHaveBeenLastCalledWith(
      expect.objectContaining({
        id: created!.id,
        projectId: "p1",
        name: "旧校舍",
      }),
    );
  });
});
