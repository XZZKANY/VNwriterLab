import { getDatabase } from "../db/database";

export interface SqlExecutor {
  select<T extends Record<string, unknown>>(
    sql: string,
    bindValues?: unknown[],
  ): Promise<T[]>;
  execute(sql: string, bindValues?: unknown[]): Promise<unknown>;
}

export type SqlExecutorFactory = () => Promise<SqlExecutor>;

export const SQLITE_PROJECT_STATUS = "draft";

export async function createTauriSqlExecutor(): Promise<SqlExecutor> {
  const database = await getDatabase();

  return {
    select: (sql, bindValues = []) => database.select(sql, bindValues),
    execute: (sql, bindValues = []) => database.execute(sql, bindValues),
  };
}

export function createSqliteTimestamp() {
  return new Date().toISOString();
}

export function toSqliteBoolean(value: boolean) {
  return value ? 1 : 0;
}

export function fromSqliteBoolean(value: unknown) {
  if (typeof value === "boolean") {
    return value;
  }

  return Number(value) > 0;
}
