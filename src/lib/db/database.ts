import Database from "@tauri-apps/plugin-sql";

export const DATABASE_URL = "sqlite:vn-writer-lab.db";

let databasePromise: Promise<Database> | null = null;

export function getDatabase() {
  if (!databasePromise) {
    databasePromise = Database.load(DATABASE_URL);
  }

  return databasePromise;
}
