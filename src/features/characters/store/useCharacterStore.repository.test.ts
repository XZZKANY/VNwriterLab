import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Character } from "../../../lib/domain/character";
import { useAutoSaveStore } from "../../../lib/store/useAutoSaveStore";
import {
  resetReferenceRepositoryForTesting,
  setReferenceRepositoryForTesting,
} from "../../../lib/repositories/referenceRepositoryRuntime";
import { useCharacterStore } from "./useCharacterStore";

function createCharacter(overrides: Partial<Character> = {}): Character {
  return {
    id: "c1",
    projectId: "p1",
    name: "林夏",
    identity: "学生会长",
    appearance: "",
    personality: "",
    goal: "",
    secret: "",
    routeId: null,
    notes: "",
    ...overrides,
  };
}

function createFakeReferenceRepository(initialCharacters: Character[] = []) {
  const characters = new Map(
    initialCharacters.map((character) => [character.id, character]),
  );
  const listCharacters = vi.fn(async (projectId: string) =>
    [...characters.values()].filter((character) => character.projectId === projectId),
  );
  const saveCharacter = vi.fn(async (character: Character) => {
    characters.set(character.id, character);
  });

  return {
    repository: {
      listCharacters,
      saveCharacter,
      listLoreEntries: vi.fn(async () => []),
      saveLoreEntry: vi.fn(async () => undefined),
      listVariables: vi.fn(async () => []),
      saveVariable: vi.fn(async () => undefined),
      saveVariables: vi.fn(async () => undefined),
    },
    listCharacters,
    saveCharacter,
  };
}

describe("useCharacterStore repository", () => {
  beforeEach(() => {
    localStorage.clear();
    useCharacterStore.getState().resetCharacters();
    useAutoSaveStore.getState().reset();
    resetReferenceRepositoryForTesting();
  });

  it("hydrateCharacters 会从 repository 恢复角色并同步选中项", async () => {
    const fake = createFakeReferenceRepository([createCharacter()]);
    setReferenceRepositoryForTesting(fake.repository);

    await useCharacterStore.getState().hydrateCharacters("p1");

    expect(fake.listCharacters).toHaveBeenCalledWith("p1");
    expect(useCharacterStore.getState().characters[0]?.name).toBe("林夏");
    expect(useCharacterStore.getState().selectedCharacterId).toBe("c1");
    expect(useAutoSaveStore.getState().hasRestoredDraft).toBe(true);
  });

  it("createCharacter 与 updateCharacter 会通过 repository 保存", async () => {
    const fake = createFakeReferenceRepository();
    setReferenceRepositoryForTesting(fake.repository);

    const created = useCharacterStore.getState().createCharacter("p1");
    expect(created).not.toBeNull();

    useCharacterStore.getState().updateCharacter(created!.id, {
      name: "林夏",
      identity: "学生会长",
    });

    expect(fake.saveCharacter).toHaveBeenCalled();
    expect(fake.saveCharacter).toHaveBeenLastCalledWith(
      expect.objectContaining({
        id: created!.id,
        projectId: "p1",
        name: "林夏",
        identity: "学生会长",
      }),
    );
  });
});
