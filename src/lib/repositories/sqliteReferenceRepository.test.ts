import { afterEach, describe, expect, it, vi } from "vitest";
import type { Character } from "../domain/character";
import type { LoreEntry } from "../domain/lore";
import type { ProjectVariable } from "../domain/variable";
import { createSqliteReferenceRepository } from "./sqliteReferenceRepository";
import type { SqlExecutor } from "./sqliteRepositoryUtils";

type SelectResponse = Array<Record<string, unknown>>;

function createFakeExecutor(selectResponses: SelectResponse[] = []) {
  const selectCalls: Array<{ sql: string; bindValues: unknown[] }> = [];
  const executeCalls: Array<{ sql: string; bindValues: unknown[] }> = [];
  const selectMock = vi.fn(async (sql: string, bindValues: unknown[] = []) => {
    selectCalls.push({ sql, bindValues });
    return selectResponses.shift() ?? [];
  });
  const executeMock = vi.fn(async (sql: string, bindValues: unknown[] = []) => {
    executeCalls.push({ sql, bindValues });
    return { rowsAffected: 1 };
  });

  const executor: SqlExecutor = {
    select: async <T extends Record<string, unknown>>(
      sql: string,
      bindValues: unknown[] = [],
    ) => (await selectMock(sql, bindValues)) as T[],
    execute: async (sql: string, bindValues: unknown[] = []) =>
      executeMock(sql, bindValues),
  };

  return { selectCalls, executeCalls, factory: async () => executor };
}

afterEach(() => {
  vi.restoreAllMocks();
});

function createCharacter(): Character {
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
  };
}

function createLoreEntry(): LoreEntry {
  return {
    id: "lore-1",
    projectId: "project-1",
    name: "旧校舍",
    category: "location",
    description: "封闭多年的教学楼",
    tags: ["调查", "旧楼"],
  };
}

function createVariable(): ProjectVariable {
  return {
    id: "variable-1",
    projectId: "project-1",
    name: "拥有钥匙",
    variableType: "flag",
    defaultValue: 1,
  };
}

describe("createSqliteReferenceRepository", () => {
  it("listCharacters 会返回角色列表", async () => {
    const fake = createFakeExecutor([
      [
        {
          id: "character-1",
          project_id: "project-1",
          name: "林夏",
          identity: "学生",
          appearance: "短发",
          personality: "冷静",
          goal: "找出真相",
          secret: "知道钥匙下落",
          route_id: null,
          notes: "",
        },
      ],
    ]);
    const repository = createSqliteReferenceRepository(fake.factory);

    await expect(repository.listCharacters("project-1")).resolves.toEqual([
      createCharacter(),
    ]);
  });

  it("saveCharacter 会执行 upsert", async () => {
    const fake = createFakeExecutor();
    const repository = createSqliteReferenceRepository(fake.factory);

    await repository.saveCharacter(createCharacter());

    expect(fake.executeCalls[0]?.sql).toContain("INSERT INTO characters");
    expect(fake.executeCalls[0]?.sql).toContain("ON CONFLICT(id) DO UPDATE");
  });

  it("listLoreEntries 会解析 tags_json", async () => {
    const fake = createFakeExecutor([
      [
        {
          id: "lore-1",
          project_id: "project-1",
          name: "旧校舍",
          category: "location",
          description: "封闭多年的教学楼",
          tags_json: JSON.stringify(["调查", "旧楼"]),
        },
      ],
    ]);
    const repository = createSqliteReferenceRepository(fake.factory);

    await expect(repository.listLoreEntries("project-1")).resolves.toEqual([
      createLoreEntry(),
    ]);
  });

  it("saveLoreEntry 会写入 tags_json", async () => {
    const fake = createFakeExecutor();
    const repository = createSqliteReferenceRepository(fake.factory);

    await repository.saveLoreEntry(createLoreEntry());

    expect(fake.executeCalls[0]?.bindValues).toEqual(
      expect.arrayContaining([JSON.stringify(["调查", "旧楼"])]),
    );
  });

  it("listVariables 会返回变量列表", async () => {
    const fake = createFakeExecutor([
      [
        {
          id: "variable-1",
          project_id: "project-1",
          name: "拥有钥匙",
          variable_type: "flag",
          default_value: 1,
        },
      ],
    ]);
    const repository = createSqliteReferenceRepository(fake.factory);

    await expect(repository.listVariables("project-1")).resolves.toEqual([
      createVariable(),
    ]);
  });

  it("saveVariable 会执行 upsert", async () => {
    const fake = createFakeExecutor();
    const repository = createSqliteReferenceRepository(fake.factory);

    await repository.saveVariable(createVariable());

    expect(fake.executeCalls[0]?.sql).toContain(
      "INSERT INTO project_variables",
    );
    expect(fake.executeCalls[0]?.sql).toContain("ON CONFLICT(id) DO UPDATE");
  });

  it("saveVariables 会按项目重写变量集合", async () => {
    const fake = createFakeExecutor();
    const repository = createSqliteReferenceRepository(fake.factory);

    await repository.saveVariables("project-1", [createVariable()]);

    expect(fake.executeCalls[0]?.sql).toContain(
      "DELETE FROM project_variables",
    );
    expect(fake.executeCalls[0]?.bindValues).toEqual(["project-1"]);
    expect(fake.executeCalls[1]?.sql).toContain(
      "INSERT INTO project_variables",
    );
    expect(fake.executeCalls[1]?.bindValues).toEqual(
      expect.arrayContaining(["variable-1", "project-1", "拥有钥匙"]),
    );
  });
});
