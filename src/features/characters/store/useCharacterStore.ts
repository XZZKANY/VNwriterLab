import { create } from "zustand";
import {
  createEmptyCharacter,
  type Character,
} from "../../../lib/domain/character";
import { getReferenceRepository } from "../../../lib/repositories/referenceRepositoryRuntime";
import { useAutoSaveStore } from "../../../lib/store/useAutoSaveStore";

interface CharacterState {
  characters: Character[];
  selectedCharacterId: string | null;
  hydrateCharacters: (projectId: string) => Promise<void>;
  createCharacter: (projectId: string) => Character | null;
  selectCharacter: (characterId: string) => void;
  updateCharacter: (
    characterId: string,
    input: Partial<
      Pick<
        Character,
        | "name"
        | "identity"
        | "appearance"
        | "personality"
        | "goal"
        | "secret"
        | "routeId"
        | "notes"
      >
    >,
  ) => void;
  resetCharacters: () => void;
}

const initialState = {
  characters: [] as Character[],
  selectedCharacterId: null as string | null,
};

export const useCharacterStore = create<CharacterState>()((set, get) => ({
  ...initialState,
  async hydrateCharacters(projectId) {
    const trimmedProjectId = projectId.trim();
    if (!trimmedProjectId) {
      useAutoSaveStore.getState().markHydrated(false);
      return;
    }

    const characters =
      await getReferenceRepository().listCharacters(trimmedProjectId);
    const currentSelectedCharacterId = get().selectedCharacterId;
    const nextSelectedCharacterId =
      currentSelectedCharacterId &&
      characters.some((character) => character.id === currentSelectedCharacterId)
        ? currentSelectedCharacterId
        : characters[0]?.id ?? null;

    set({
      characters,
      selectedCharacterId: nextSelectedCharacterId,
    });

    useAutoSaveStore.getState().markHydrated(characters.length > 0);
  },
  createCharacter(projectId) {
    const trimmedProjectId = projectId.trim();
    if (!trimmedProjectId) {
      return null;
    }

    useAutoSaveStore.getState().markDirty();

    const nextCharacter = createEmptyCharacter({
      projectId: trimmedProjectId,
      index: get().characters.filter(
        (character) => character.projectId === trimmedProjectId,
      ).length,
    });

    set({
      characters: [...get().characters, nextCharacter],
      selectedCharacterId: nextCharacter.id,
    });

    useAutoSaveStore.getState().markSaved();
    void getReferenceRepository().saveCharacter(nextCharacter);

    return nextCharacter;
  },
  selectCharacter(characterId) {
    set({ selectedCharacterId: characterId });
  },
  updateCharacter(characterId, input) {
    const targetCharacter = get().characters.find(
      (character) => character.id === characterId,
    );
    if (!targetCharacter) {
      return;
    }

    useAutoSaveStore.getState().markDirty();

    const nextCharacters = get().characters.map((character) =>
      character.id === characterId
        ? {
            ...character,
            ...input,
          }
        : character,
    );
    const nextCharacter = nextCharacters.find(
      (character) => character.id === characterId,
    );

    set({
      characters: nextCharacters,
    });

    useAutoSaveStore.getState().markSaved();
    if (nextCharacter) {
      void getReferenceRepository().saveCharacter(nextCharacter);
    }
  },
  resetCharacters() {
    set(initialState);
  },
}));
