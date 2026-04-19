import type { LoreEntry } from "../domain/lore";
import type { ProjectVariable } from "../domain/variable";
import type { ReferenceRepository } from "./referenceRepository";
import {
  createSqliteTimestamp,
  createTauriSqlExecutor,
  type SqlExecutorFactory,
} from "./sqliteRepositoryUtils";

interface SqliteCharacterRow extends Record<string, unknown> {
  id: string;
  project_id: string;
  name: string;
  identity: string;
  appearance: string;
  personality: string;
  goal: string;
  secret: string;
  route_id: string | null;
  notes: string;
}

interface SqliteLoreRow extends Record<string, unknown> {
  id: string;
  project_id: string;
  name: string;
  category: LoreEntry["category"];
  description: string;
  tags_json: string;
}

interface SqliteVariableRow extends Record<string, unknown> {
  id: string;
  project_id: string;
  name: string;
  variable_type: ProjectVariable["variableType"];
  default_value: number;
}

export function createSqliteReferenceRepository(
  createExecutor: SqlExecutorFactory = createTauriSqlExecutor,
): ReferenceRepository {
  return {
    async listCharacters(projectId) {
      const executor = await createExecutor();
      const rows = await executor.select<SqliteCharacterRow>(
        `SELECT id, project_id, name, identity, appearance, personality, goal, secret, route_id, notes
         FROM characters
         WHERE project_id = $1
         ORDER BY name, id`,
        [projectId],
      );

      return rows.map((row) => ({
        id: row.id,
        projectId: row.project_id,
        name: row.name,
        identity: row.identity,
        appearance: row.appearance,
        personality: row.personality,
        goal: row.goal,
        secret: row.secret,
        routeId: row.route_id,
        notes: row.notes,
      }));
    },
    async saveCharacter(character) {
      const executor = await createExecutor();
      const timestamp = createSqliteTimestamp();

      await executor.execute(
        `INSERT INTO characters (
           id, project_id, name, identity, appearance, personality, goal, secret, route_id, notes, created_at, updated_at
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         ON CONFLICT(id) DO UPDATE SET
           project_id = excluded.project_id,
           name = excluded.name,
           identity = excluded.identity,
           appearance = excluded.appearance,
           personality = excluded.personality,
           goal = excluded.goal,
           secret = excluded.secret,
           route_id = excluded.route_id,
           notes = excluded.notes,
           updated_at = excluded.updated_at`,
        [
          character.id,
          character.projectId,
          character.name,
          character.identity,
          character.appearance,
          character.personality,
          character.goal,
          character.secret,
          character.routeId,
          character.notes,
          timestamp,
          timestamp,
        ],
      );
    },
    async listLoreEntries(projectId) {
      const executor = await createExecutor();
      const rows = await executor.select<SqliteLoreRow>(
        `SELECT id, project_id, name, category, description, tags_json
         FROM lore_entries
         WHERE project_id = $1
         ORDER BY name, id`,
        [projectId],
      );

      return rows.map((row) => ({
        id: row.id,
        projectId: row.project_id,
        name: row.name,
        category: row.category,
        description: row.description,
        tags: JSON.parse(row.tags_json) as string[],
      }));
    },
    async saveLoreEntry(entry) {
      const executor = await createExecutor();
      const timestamp = createSqliteTimestamp();

      await executor.execute(
        `INSERT INTO lore_entries (
           id, project_id, name, category, description, tags_json, created_at, updated_at
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT(id) DO UPDATE SET
           project_id = excluded.project_id,
           name = excluded.name,
           category = excluded.category,
           description = excluded.description,
           tags_json = excluded.tags_json,
           updated_at = excluded.updated_at`,
        [
          entry.id,
          entry.projectId,
          entry.name,
          entry.category,
          entry.description,
          JSON.stringify(entry.tags),
          timestamp,
          timestamp,
        ],
      );
    },
    async listVariables(projectId) {
      const executor = await createExecutor();
      const rows = await executor.select<SqliteVariableRow>(
        `SELECT id, project_id, name, variable_type, default_value
         FROM project_variables
         WHERE project_id = $1
         ORDER BY name, id`,
        [projectId],
      );

      return rows.map((row) => ({
        id: row.id,
        projectId: row.project_id,
        name: row.name,
        variableType: row.variable_type,
        defaultValue: Number(row.default_value),
      }));
    },
    async saveVariable(variable) {
      const executor = await createExecutor();
      const timestamp = createSqliteTimestamp();

      await executor.execute(
        `INSERT INTO project_variables (
           id, project_id, name, variable_type, default_value, created_at, updated_at
         ) VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT(id) DO UPDATE SET
           project_id = excluded.project_id,
           name = excluded.name,
           variable_type = excluded.variable_type,
           default_value = excluded.default_value,
           updated_at = excluded.updated_at`,
        [
          variable.id,
          variable.projectId,
          variable.name,
          variable.variableType,
          variable.defaultValue,
          timestamp,
          timestamp,
        ],
      );
    },
    async saveVariables(projectId, variables) {
      const executor = await createExecutor();
      const timestamp = createSqliteTimestamp();

      await executor.execute(
        `DELETE FROM project_variables
         WHERE project_id = $1`,
        [projectId],
      );

      for (const variable of variables) {
        await executor.execute(
          `INSERT INTO project_variables (
             id, project_id, name, variable_type, default_value, created_at, updated_at
           ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            variable.id,
            variable.projectId,
            variable.name,
            variable.variableType,
            variable.defaultValue,
            timestamp,
            timestamp,
          ],
        );
      }
    },
  };
}
