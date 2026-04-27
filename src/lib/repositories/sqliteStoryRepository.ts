import type { SceneBlock } from "../domain/block";
import type { SceneLink } from "../domain/link";
import { createSceneInRoute } from "../domain/project";
import type { Scene } from "../domain/scene";
import type { StoryRepository } from "./storyRepository";
import {
  createSqliteTimestamp,
  createTauriSqlExecutor,
  fromSqliteBoolean,
  type SqlExecutorFactory,
  toSqliteBoolean,
} from "./sqliteRepositoryUtils";

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

interface SqliteSceneLinkRow extends Record<string, unknown> {
  id: string;
  project_id: string;
  from_scene_id: string;
  to_scene_id: string;
  link_type: SceneLink["linkType"];
  source_block_id: string | null;
  label: string;
  condition_id: string | null;
  priority_order: number;
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

function mapSceneRowToDomain(row: SqliteSceneRow, blocks: SceneBlock[]): Scene {
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

function mapLinkRowToDomain(row: SqliteSceneLinkRow): SceneLink {
  return {
    id: row.id,
    projectId: row.project_id,
    fromSceneId: row.from_scene_id,
    toSceneId: row.to_scene_id,
    linkType: row.link_type,
    sourceBlockId: row.source_block_id,
    label: row.label,
    conditionId: row.condition_id,
    priorityOrder: Number(row.priority_order),
  };
}

export function createSqliteStoryRepository(
  createExecutor: SqlExecutorFactory = createTauriSqlExecutor,
): StoryRepository {
  return {
    async listScenes(projectId) {
      const executor = await createExecutor();
      const sceneRows = await executor.select<SqliteSceneRow>(
        `SELECT id, project_id, route_id, title, summary, scene_type, status,
                chapter_label, sort_order, is_start_scene, is_ending_scene, notes
         FROM scenes
         WHERE project_id = $1
         ORDER BY route_id, sort_order, id`,
        [projectId],
      );

      return Promise.all(
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
    },
    async createScene(input) {
      const executor = await createExecutor();
      if (!input.scene) {
        const maxSortRows = await executor.select<{
          max_sort_order: number | null;
        }>(
          `SELECT COALESCE(MAX(sort_order), -1) AS max_sort_order
           FROM scenes
           WHERE route_id = $1`,
          [input.routeId],
        );

        const nextSortOrder = Number(maxSortRows[0]?.max_sort_order ?? -1) + 1;
        const baseScene = createSceneInRoute({
          projectId: input.projectId,
          routeId: input.routeId,
          sortOrder: nextSortOrder,
        });
        const generatedScene: Scene = {
          ...baseScene,
          title: input.title.trim() || baseScene.title,
          chapterLabel: input.chapterLabel,
        };
        const timestamp = createSqliteTimestamp();

        await executor.execute(
          `INSERT INTO scenes (
             id, project_id, route_id, title, summary, scene_type, status, chapter_label,
             sort_order, is_start_scene, is_ending_scene, notes, created_at, updated_at
           ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
          [
            generatedScene.id,
            generatedScene.projectId,
            generatedScene.routeId,
            generatedScene.title,
            generatedScene.summary,
            generatedScene.sceneType,
            generatedScene.status,
            generatedScene.chapterLabel,
            generatedScene.sortOrder,
            toSqliteBoolean(generatedScene.isStartScene),
            toSqliteBoolean(generatedScene.isEndingScene),
            generatedScene.notes,
            timestamp,
            timestamp,
          ],
        );

        return generatedScene;
      }
      const nextScene = input.scene;
      const timestamp = createSqliteTimestamp();

      await executor.execute(
        `INSERT INTO scenes (
           id, project_id, route_id, title, summary, scene_type, status, chapter_label,
           sort_order, is_start_scene, is_ending_scene, notes, created_at, updated_at
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
        [
          nextScene.id,
          nextScene.projectId,
          nextScene.routeId,
          nextScene.title,
          nextScene.summary,
          nextScene.sceneType,
          nextScene.status,
          nextScene.chapterLabel,
          nextScene.sortOrder,
          toSqliteBoolean(nextScene.isStartScene),
          toSqliteBoolean(nextScene.isEndingScene),
          nextScene.notes,
          timestamp,
          timestamp,
        ],
      );

      return nextScene;
    },
    async updateScene(scene) {
      const executor = await createExecutor();
      const timestamp = createSqliteTimestamp();

      await executor.execute(
        `UPDATE scenes
         SET project_id = $1, route_id = $2, title = $3, summary = $4, scene_type = $5,
             status = $6, chapter_label = $7, sort_order = $8, is_start_scene = $9,
             is_ending_scene = $10, notes = $11, updated_at = $12
         WHERE id = $13`,
        [
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
          scene.id,
        ],
      );
    },
    async deleteScene(sceneId) {
      const executor = await createExecutor();

      await executor.execute(
        `DELETE FROM scene_links
         WHERE from_scene_id = $1 OR to_scene_id = $1`,
        [sceneId],
      );
      await executor.execute(
        `DELETE FROM scene_blocks
         WHERE scene_id = $1`,
        [sceneId],
      );
      await executor.execute(
        `DELETE FROM scenes
         WHERE id = $1`,
        [sceneId],
      );
    },
    async saveBlocks(sceneId, blocks) {
      const executor = await createExecutor();
      const timestamp = createSqliteTimestamp();

      await executor.execute(
        `DELETE FROM scene_blocks
         WHERE scene_id = $1`,
        [sceneId],
      );

      for (const block of blocks) {
        await executor.execute(
          `INSERT INTO scene_blocks (
             id, scene_id, block_type, sort_order, character_id, content_text, meta_json, created_at, updated_at
           ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            block.id,
            sceneId,
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
    },
    async listLinks(projectId) {
      const executor = await createExecutor();
      const linkRows = await executor.select<SqliteSceneLinkRow>(
        `SELECT id, project_id, from_scene_id, to_scene_id, link_type,
                source_block_id, label, condition_id, priority_order
         FROM scene_links
         WHERE project_id = $1
         ORDER BY priority_order, id`,
        [projectId],
      );

      return linkRows.map(mapLinkRowToDomain);
    },
    async saveLinks(projectId, links) {
      const executor = await createExecutor();
      const timestamp = createSqliteTimestamp();

      await executor.execute(
        `DELETE FROM scene_links
         WHERE project_id = $1`,
        [projectId],
      );

      for (const link of links) {
        await executor.execute(
          `INSERT INTO scene_links (
             id, project_id, from_scene_id, to_scene_id, link_type, source_block_id,
             label, condition_id, priority_order, created_at, updated_at
           ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
          [
            link.id,
            projectId,
            link.fromSceneId,
            link.toSceneId,
            link.linkType,
            link.sourceBlockId,
            link.label,
            link.conditionId,
            link.priorityOrder,
            timestamp,
            timestamp,
          ],
        );
      }
    },
  };
}
