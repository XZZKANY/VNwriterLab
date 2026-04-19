import type { Character } from "../domain/character";
import type { LoreEntry } from "../domain/lore";
import type { ProjectVariable } from "../domain/variable";
import type { ReferenceRepository } from "./referenceRepository";
import { createSqliteReferenceRepository } from "./sqliteReferenceRepository";

function createVolatileReferenceRepository(): ReferenceRepository {
  const characters = new Map<string, Character>();
  const loreEntries = new Map<string, LoreEntry>();
  const variables = new Map<string, ProjectVariable>();

  function sortByNameAndId<T extends { id: string; name: string }>(items: T[]) {
    return [...items].sort((left, right) => {
      const nameOrder = left.name.localeCompare(right.name);
      if (nameOrder !== 0) {
        return nameOrder;
      }

      return left.id.localeCompare(right.id);
    });
  }

  return {
    async listCharacters(projectId) {
      return sortByNameAndId(
        [...characters.values()].filter((character) => character.projectId === projectId),
      );
    },
    async saveCharacter(character) {
      characters.set(character.id, character);
    },
    async listLoreEntries(projectId) {
      return sortByNameAndId(
        [...loreEntries.values()].filter((entry) => entry.projectId === projectId),
      );
    },
    async saveLoreEntry(entry) {
      loreEntries.set(entry.id, entry);
    },
    async listVariables(projectId) {
      return sortByNameAndId(
        [...variables.values()].filter((variable) => variable.projectId === projectId),
      );
    },
    async saveVariable(variable) {
      variables.set(variable.id, variable);
    },
    async saveVariables(projectId, nextVariables) {
      for (const variable of [...variables.values()]) {
        if (variable.projectId === projectId) {
          variables.delete(variable.id);
        }
      }

      for (const variable of nextVariables) {
        variables.set(variable.id, variable);
      }
    },
  };
}

let referenceRepositoryOverride: ReferenceRepository | null = null;
let referenceRepositorySingleton: ReferenceRepository | null = null;

function canUseSqliteRuntime() {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

export function getReferenceRepository() {
  if (referenceRepositoryOverride) {
    return referenceRepositoryOverride;
  }

  if (!referenceRepositorySingleton) {
    referenceRepositorySingleton = canUseSqliteRuntime()
      ? createSqliteReferenceRepository()
      : createVolatileReferenceRepository();
  }

  return referenceRepositorySingleton;
}

export function setReferenceRepositoryForTesting(repository: ReferenceRepository) {
  referenceRepositoryOverride = repository;
}

export function resetReferenceRepositoryForTesting() {
  referenceRepositoryOverride = null;
  referenceRepositorySingleton = null;
}
