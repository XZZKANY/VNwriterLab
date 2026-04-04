use tauri_plugin_sql::{Migration, MigrationKind};

pub fn build_migrations() -> Vec<Migration> {
    vec![Migration {
        version: 1,
        description: "create_v1_tables",
        kind: MigrationKind::Up,
        sql: r#"
        CREATE TABLE IF NOT EXISTS projects (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          summary TEXT NOT NULL,
          project_type TEXT NOT NULL,
          status TEXT NOT NULL,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS routes (
          id TEXT PRIMARY KEY,
          project_id TEXT NOT NULL,
          name TEXT NOT NULL,
          route_type TEXT NOT NULL,
          description TEXT NOT NULL,
          sort_order INTEGER NOT NULL,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS scenes (
          id TEXT PRIMARY KEY,
          project_id TEXT NOT NULL,
          route_id TEXT NOT NULL,
          title TEXT NOT NULL,
          summary TEXT NOT NULL,
          scene_type TEXT NOT NULL,
          status TEXT NOT NULL,
          chapter_label TEXT NOT NULL,
          sort_order INTEGER NOT NULL,
          is_start_scene INTEGER NOT NULL,
          is_ending_scene INTEGER NOT NULL,
          notes TEXT NOT NULL,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS scene_blocks (
          id TEXT PRIMARY KEY,
          scene_id TEXT NOT NULL,
          block_type TEXT NOT NULL,
          sort_order INTEGER NOT NULL,
          character_id TEXT,
          content_text TEXT NOT NULL,
          meta_json TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS scene_links (
          id TEXT PRIMARY KEY,
          project_id TEXT NOT NULL,
          from_scene_id TEXT NOT NULL,
          to_scene_id TEXT NOT NULL,
          link_type TEXT NOT NULL,
          source_block_id TEXT,
          label TEXT NOT NULL,
          condition_id TEXT,
          priority_order INTEGER NOT NULL,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS characters (
          id TEXT PRIMARY KEY,
          project_id TEXT NOT NULL,
          name TEXT NOT NULL,
          identity TEXT NOT NULL,
          appearance TEXT NOT NULL,
          personality TEXT NOT NULL,
          goal TEXT NOT NULL,
          secret TEXT NOT NULL,
          route_id TEXT,
          notes TEXT NOT NULL,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS lore_entries (
          id TEXT PRIMARY KEY,
          project_id TEXT NOT NULL,
          name TEXT NOT NULL,
          category TEXT NOT NULL,
          description TEXT NOT NULL,
          tags_json TEXT NOT NULL,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS project_variables (
          id TEXT PRIMARY KEY,
          project_id TEXT NOT NULL,
          name TEXT NOT NULL,
          variable_type TEXT NOT NULL,
          default_value INTEGER NOT NULL,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS conditions (
          id TEXT PRIMARY KEY,
          project_id TEXT NOT NULL,
          variable_id TEXT NOT NULL,
          operator TEXT NOT NULL,
          compare_value INTEGER NOT NULL,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );
        "#,
    }]
}
