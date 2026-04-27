import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Character } from "../domain/character";
import type { LoreEntry } from "../domain/lore";
import type { ProjectVariable } from "../domain/variable";
import type { ReferenceRepository } from "./referenceRepository";

vi.unmock("./sqliteReferenceRepository");

function createCharacter(overrides: Partial<Character> = {}): Character {
  return {
    id: "character-1",
    projectId: "project-1",
    name: "林夏",
    identity: "学生",
    appearance: "短发",
    personality: "冷静",
    goal: "找出真相",
    secret: "知道钥匙下落",
    routeId: null,
    notes: "",
    ...overrides,
  };
}

function createLoreEntry(overrides: Partial<LoreEntry> = {}): LoreEntry {
  return {
    id: "lore-1",
    projectId: "project-1",
    name: "旧校舍",
    category: "location",
    description: "封闭多年的教学楼",
    tags: ["调查", "旧楼"],
    ...overrides,
  };
}

function createVariable(
  overrides: Partial<ProjectVariable> = {},
): ProjectVariable {
  return {
    id: "variable-1",
    projectId: "project-1",
    name: "拥有钥匙",
    variableType: "flag",
    defaultValue: 1,
    ...overrides,
  };
}

function createFakeReferenceRepository(): ReferenceRepository {
  const characters = new Map<string, Character>();
  const loreEntries = new Map<string, LoreEntry>();
  const variables = new Map<string, ProjectVariable>();

  return {
    async listCharacters(projectId) {
      return [...characters.values()].filter(
        (character) => character.projectId === projectId,
      );
    },
    async saveCharacter(character) {
      characters.set(character.id, character);
    },
    async listLoreEntries(projectId) {
      return [...loreEntries.values()].filter(
        (entry) => entry.projectId === projectId,
      );
    },
    async saveLoreEntry(entry) {
      loreEntries.set(entry.id, entry);
    },
    async listVariables(projectId) {
      return [...variables.values()].filter(
        (variable) => variable.projectId === projectId,
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

function setTauriInternals(value: unknown) {
  Object.defineProperty(window, "__TAURI_INTERNALS__", {
    configurable: true,
    value,
    writable: true,
  });
}

function clearTauriInternals() {
  if ("__TAURI_INTERNALS__" in window) {
    delete (window as Window & { __TAURI_INTERNALS__?: unknown })
      .__TAURI_INTERNALS__;
  }
}

describe("referenceRepositoryRuntime", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
    clearTauriInternals();
  });

  afterEach(() => {
    clearTauriInternals();
  });

  it("非 Tauri 环境会返回 volatile repository", async () => {
    const runtime = await import("./referenceRepositoryRuntime");
    const repository = runtime.getReferenceRepository();

    await repository.saveCharacter(createCharacter());
    await repository.saveLoreEntry(createLoreEntry());
    await repository.saveVariable(createVariable());

    await expect(repository.listCharacters("project-1")).resolves.toEqual([
      createCharacter(),
    ]);
    await expect(repository.listLoreEntries("project-1")).resolves.toEqual([
      createLoreEntry(),
    ]);
    await expect(repository.listVariables("project-1")).resolves.toEqual([
      createVariable(),
    ]);
  });

  it("set/reset 会接管并恢复测试仓库", async () => {
    const runtime = await import("./referenceRepositoryRuntime");
    const fakeRepository = createFakeReferenceRepository();

    runtime.setReferenceRepositoryForTesting(fakeRepository);
    expect(runtime.getReferenceRepository()).toBe(fakeRepository);

    runtime.resetReferenceRepositoryForTesting();
    expect(runtime.getReferenceRepository()).not.toBe(fakeRepository);
  });

  it("Tauri 环境会选择 sqlite repository", async () => {
    const fakeRepository = createFakeReferenceRepository();
    vi.doMock("./sqliteReferenceRepository", () => ({
      createSqliteReferenceRepository: vi.fn(() => fakeRepository),
    }));
    setTauriInternals({});

    const runtime = await import("./referenceRepositoryRuntime");

    expect(runtime.getReferenceRepository()).toBe(fakeRepository);
  });
});
