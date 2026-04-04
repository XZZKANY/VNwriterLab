import type { Character } from "../domain/character";
import type { LoreEntry } from "../domain/lore";
import type { ProjectVariable } from "../domain/variable";

export interface ReferenceRepository {
  listCharacters(projectId: string): Promise<Character[]>;
  saveCharacter(character: Character): Promise<void>;
  listLoreEntries(projectId: string): Promise<LoreEntry[]>;
  saveLoreEntry(entry: LoreEntry): Promise<void>;
  listVariables(projectId: string): Promise<ProjectVariable[]>;
  saveVariable(variable: ProjectVariable): Promise<void>;
}
