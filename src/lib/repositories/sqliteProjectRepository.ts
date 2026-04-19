import type { SceneBlock } from "../domain/block";
import {
  createEmptyProject,
  type Project,
  type ProjectTemplate,
  type Route,
} from "../domain/project";
import type { Scene } from "../domain/scene";
import type { ProjectRepository } from "./projectRepository";
import {
  createSqliteTimestamp,
  createTauriSqlExecutor,
  fromSqliteBoolean,
  SQLITE_PROJECT_STATUS,
  type SqlExecutor,
  type SqlExecutorFactory,
  toSqliteBoolean,
} from "./sqliteRepositoryUtils";

interface SqliteProjectRow extends Record<string, unknown> {
  id: string;
  name: string;
  summary: string;
  project_type: Project["projectType"];
}

interface SqliteRouteRow extends Record<string, unknown> {
  id: string;
  project_id: string;
  name: string;
  route_type: Route["routeType"];
  description: string;
  sort_order: number;
}

interface SqliteSceneRow extends Record<string, unknown> {
  id: string;
  project_id: string;
  route_id: string;
  title: string;
  summary: string;
  scene_type: Scene["sceneType"];
  status: Scene["status"];
  chapter_label: string;
  sort_order: number;
  is_start_scene: number | boolean;
  is_ending_scene: number | boolean;
  notes: string;
}

interface SqliteSceneBlockRow extends Record<string, unknown> {
  id: string;
  scene_id: string;
  block_type: SceneBlock["blockType"];
  sort_order: number;
  character_id: string | null;
  content_text: string;
  meta_json: string | null;
}

function mapRouteRowToDomain(row: SqliteRouteRow): Route {
  return {
    id: row.id,
    projectId: row.project_id,
    name: row.name,
    routeType: row.route_type,
    description: row.description,
    sortOrder: Number(row.sort_order),
  };
}

function mapBlockRowToDomain(row: SqliteSceneBlockRow): SceneBlock {
  return {
    id: row.id,
    sceneId: row.scene_id,
    blockType: row.block_type,
    sortOrder: Number(row.sort_order),
    characterId: row.character_id,
    contentText: row.content_text,
    metaJson: row.meta_json,
  };
}

function mapSceneRowToDomain(
  row: SqliteSceneRow,
  blocks: SceneBlock[],
): Scene {
  return {
    id: row.id,
    projectId: row.project_id,
    routeId: row.route_id,
    title: row.title,
    summary: row.summary,
    sceneType: row.scene_type,
    status: row.status,
    chapterLabel: row.chapter_label,
    sortOrder: Number(row.sort_order),
    isStartScene: fromSqliteBoolean(row.is_start_scene),
    isEndingScene: fromSqliteBoolean(row.is_ending_scene),
    notes: row.notes,
    blocks,
  };
}

async function loadProjectById(
  executor: SqlExecutor,
  projectId: string,
): Promise<Project | null> {
  const projectRows = await executor.select<SqliteProjectRow>(
    `SELECT id, name, summary, project_type
     FROM projects
     WHERE id = $1`,
    [projectId],
  );
  const projectRow = projectRows[0];
  if (!projectRow) {
    return null;
  }

  const routeRows = await executor.select<SqliteRouteRow>(
    `SELECT id, project_id, name, route_type, description, sort_order
     FROM routes
     WHERE project_id = $1
     ORDER BY sort_order, id`,
    [projectId],
  );

  const sceneRows = await executor.select<SqliteSceneRow>(
    `SELECT id, project_id, route_id, title, summary, scene_type, status,
            chapter_label, sort_order, is_start_scene, is_ending_scene, notes
     FROM scenes
     WHERE project_id = $1
     ORDER BY route_id, sort_order, id`,
    [projectId],
  );

  const scenes = await Promise.all(
    sceneRows.map(async (sceneRow) => {
      const blockRows = await executor.select<SqliteSceneBlockRow>(
        `SELECT id, scene_id, block_type, sort_order, character_id, content_text, meta_json
         FROM scene_blocks
         WHERE scene_id = $1
         ORDER BY sort_order, id`,
        [sceneRow.id],
      );

      return mapSceneRowToDomain(
        sceneRow,
        blockRows.map(mapBlockRowToDomain),
      );
    }),
  );

  return {
    id: projectRow.id,
    name: projectRow.name,
    summary: projectRow.summary,
    projectType: projectRow.project_type,
    routes: routeRows.map(mapRouteRowToDomain),
    scenes,
  };
}

async function insertRoutes(
  executor: SqlExecutor,
  routes: Route[],
  timestamp: string,
) {
  for (const route of routes) {
    await executor.execute(
      `INSERT INTO routes (
         id, project_id, name, route_type, description, sort_order, created_at, updated_at
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        route.id,
        route.projectId,
        route.name,
        route.routeType,
        route.description,
        route.sortOrder,
        timestamp,
        timestamp,
      ],
    );
  }
}

async function insertSceneBlocks(
  executor: SqlExecutor,
  scene: Scene,
  timestamp: string,
) {
  for (const block of scene.blocks) {
    await executor.execute(
      `INSERT INTO scene_blocks (
         id, scene_id, block_type, sort_order, character_id, content_text, meta_json, created_at, updated_at
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        block.id,
        scene.id,
        block.blockType,
        block.sortOrder,
        block.characterId,
        block.contentText,
        block.metaJson,
        timestamp,
        timestamp,
      ],
    );
  }
}

async function insertScenes(
  executor: SqlExecutor,
  scenes: Scene[],
  timestamp: string,
) {
  for (const scene of scenes) {
    await executor.execute(
      `INSERT INTO scenes (
         id, project_id, route_id, title, summary, scene_type, status, chapter_label,
         sort_order, is_start_scene, is_ending_scene, notes, created_at, updated_at
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
      [
        scene.id,
        scene.projectId,
        scene.routeId,
        scene.title,
        scene.summary,
        scene.sceneType,
        scene.status,
        scene.chapterLabel,
        scene.sortOrder,
        toSqliteBoolean(scene.isStartScene),
        toSqliteBoolean(scene.isEndingScene),
        scene.notes,
        timestamp,
        timestamp,
      ],
    );

    await insertSceneBlocks(executor, scene, timestamp);
  }
}

export function createSqliteProjectRepository(
  createExecutor: SqlExecutorFactory = createTauriSqlExecutor,
): ProjectRepository {
  return {
    async listProjects() {
      const executor = await createExecutor();
      const projectRows = await executor.select<SqliteProjectRow>(
        `SELECT id, name, summary, project_type
         FROM projects
         ORDER BY name, id`,
      );

      const projects = await Promise.all(
        projectRows.map((row) => loadProjectById(executor, row.id)),
      );

      return projects.filter((project): project is Project => project !== null);
    },
    async getProject(projectId) {
      const executor = await createExecutor();
      return loadProjectById(executor, projectId);
    },
    async createProject(input) {
      const executor = await createExecutor();
      const project =
        input.project ??
        createEmptyProject(
          input.name,
          input.summary,
          input.template as ProjectTemplate | undefined,
        );
      const timestamp = createSqliteTimestamp();

      await executor.execute(
        `INSERT INTO projects (
           id, name, summary, project_type, status, created_at, updated_at
         ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          project.id,
          project.name,
          project.summary,
          project.projectType,
          SQLITE_PROJECT_STATUS,
          timestamp,
          timestamp,
        ],
      );

      await insertRoutes(executor, project.routes, timestamp);
      await insertScenes(executor, project.scenes, timestamp);

      return project;
    },
    async updateProject(project) {
      const executor = await createExecutor();
      const timestamp = createSqliteTimestamp();

      await executor.execute(
        `UPDATE projects
         SET name = $1, summary = $2, project_type = $3, updated_at = $4
         WHERE id = $5`,
        [
          project.name,
          project.summary,
          project.projectType,
          timestamp,
          project.id,
        ],
      );
      await executor.execute(
        `DELETE FROM scene_blocks
         WHERE scene_id IN (SELECT id FROM scenes WHERE project_id = $1)`,
        [project.id],
      );
      await executor.execute(
        `DELETE FROM scenes
         WHERE project_id = $1`,
        [project.id],
      );
      await executor.execute(
        `DELETE FROM routes
         WHERE project_id = $1`,
        [project.id],
      );

      await insertRoutes(executor, project.routes, timestamp);
      await insertScenes(executor, project.scenes, timestamp);
    },
  };
}
