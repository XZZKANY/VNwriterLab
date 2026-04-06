import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  createEmptyCharacter,
  type Character,
} from "../../../lib/domain/character";
import { useAutoSaveStore } from "../../../lib/store/useAutoSaveStore";

interface CharacterState {
  characters: Character[];
  selectedCharacterId: string | null;
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

export const CHARACTER_STORAGE_KEY = "vn-writer-lab.character-store";

const initialState = {
  characters: [] as Character[],
  selectedCharacterId: null as string | null,
};

export const useCharacterStore = create<CharacterState>()(
  persist(
    (set, get) => ({
      ...initialState,
      createCharacter: (projectId) => {
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

        return nextCharacter;
      },
      selectCharacter: (characterId) => {
        set({ selectedCharacterId: characterId });
      },
      updateCharacter: (characterId, input) => {
        const targetCharacter = get().characters.find(
          (character) => character.id === characterId,
        );
        if (!targetCharacter) {
          return;
        }

        useAutoSaveStore.getState().markDirty();

        set({
          characters: get().characters.map((character) =>
            character.id === characterId
              ? {
                  ...character,
                  ...input,
                }
              : character,
          ),
        });

        useAutoSaveStore.getState().markSaved();
      },
      resetCharacters: () => set(initialState),
    }),
    {
      name: CHARACTER_STORAGE_KEY,
      partialize: (state) => ({
        characters: state.characters,
        selectedCharacterId: state.selectedCharacterId,
      }),
      onRehydrateStorage: () => {
        const restored = localStorage.getItem(CHARACTER_STORAGE_KEY) !== null;

        return () => {
          useAutoSaveStore.getState().markHydrated(restored);
        };
      },
    },
  ),
);
