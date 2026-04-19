import { afterEach, describe, expect, it, vi } from "vitest";
import type { Scene, SceneStatus } from "../domain/scene";
import type { SceneBlock } from "../domain/block";
import type { SceneLink } from "../domain/link";
import { createSqliteStoryRepository } from "./sqliteStoryRepository";
import type { SqlExecutor } from "./sqliteRepositoryUtils";

type SelectResponse = Array<Record<string, unknown>>;

function createFakeExecutor(selectResponses: SelectResponse[] = []) {
  const selectCalls: Array<{ sql: string; bindValues: unknown[] }> = [];
  const executeCalls: Array<{ sql: string; bindValues: unknown[] }> = [];
  const selectMock = vi.fn(
    async (sql: string, bindValues: unknown[] = []) => {
      selectCalls.push({ sql, bindValues });
      return selectResponses.shift() ?? [];
    },
  );
  const executeMock = vi.fn(
    async (sql: string, bindValues: unknown[] = []) => {
      executeCalls.push({ sql, bindValues });
      return { rowsAffected: 1 };
    },
  );

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

function createScene(status: SceneStatus = "draft"): Scene {
  return {
    id: "scene-1",
    projectId: "project-1",
    routeId: "route-1",
    title: "开场",
    summary: "",
    sceneType: "normal",
    status,
    chapterLabel: "第一章",
    sortOrder: 0,
    isStartScene: true,
    isEndingScene: false,
    notes: "",
    blocks: [],
  };
}

function createBlock(): SceneBlock {
  return {
    id: "block-1",
    sceneId: "scene-1",
    blockType: "dialogue",
    sortOrder: 0,
    characterId: null,
    contentText: "你好",
    metaJson: null,
  };
}

function createLink(): SceneLink {
  return {
    id: "link-1",
    projectId: "project-1",
    fromSceneId: "scene-1",
    toSceneId: "scene-2",
    linkType: "choice",
    sourceBlockId: "block-1",
    label: "去旧校舍",
    conditionId: null,
    priorityOrder: 0,
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("createSqliteStoryRepository", () => {
  it("listScenes 会加载场景和块", async () => {
    const fake = createFakeExecutor([
      [
        {
          id: "scene-1",
          project_id: "project-1",
          route_id: "route-1",
          title: "开场",
          summary: "",
          scene_type: "normal",
          status: "draft",
          chapter_label: "第一章",
          sort_order: 0,
          is_start_scene: 1,
          is_ending_scene: 0,
          notes: "",
        },
      ],
      [
        {
          id: "block-1",
          scene_id: "scene-1",
          block_type: "dialogue",
          sort_order: 0,
          character_id: null,
          content_text: "你好",
          meta_json: null,
        },
      ],
    ]);
    const repository = createSqliteStoryRepository(fake.factory);

    await expect(repository.listScenes("project-1")).resolves.toEqual([
      {
        ...createScene(),
        blocks: [createBlock()],
      },
    ]);
  });

  it("createScene 会根据路线尾部顺序创建新场景", async () => {
    const fake = createFakeExecutor([[{ max_sort_order: 2 }]]);
    vi.spyOn(crypto, "randomUUID").mockReturnValueOnce(
      "scene-0000-0000-0000-000000000003",
    );
    const repository = createSqliteStoryRepository(fake.factory);

    const scene = await repository.createScene({
      projectId: "project-1",
      routeId: "route-1",
      title: "新场景",
      chapterLabel: "第二章",
    });

    expect(scene).toMatchObject({
      id: "scene-0000-0000-0000-000000000003",
      routeId: "route-1",
      title: "新场景",
      chapterLabel: "第二章",
      sortOrder: 3,
      isStartScene: false,
    });
    expect(fake.executeCalls[0]?.sql).toContain("INSERT INTO scenes");
  });

  it("createScene 支持按既有 scene 写入元数据", async () => {
    const fake = createFakeExecutor();
    const repository = createSqliteStoryRepository(fake.factory);
    const scene = createScene("completed");

    await expect(
      repository.createScene({
        projectId: scene.projectId,
        routeId: scene.routeId,
        title: scene.title,
        chapterLabel: scene.chapterLabel,
        scene,
      }),
    ).resolves.toEqual(scene);

    expect(fake.selectCalls).toHaveLength(0);
    expect(fake.executeCalls[0]?.sql).toContain("INSERT INTO scenes");
    expect(fake.executeCalls[0]?.bindValues).toEqual(
      expect.arrayContaining(["scene-1", "project-1", "completed"]),
    );
  });

  it("updateScene 会更新场景主表字段", async () => {
    const fake = createFakeExecutor();
    const repository = createSqliteStoryRepository(fake.factory);

    await repository.updateScene(createScene("completed"));

    expect(fake.executeCalls[0]?.sql).toContain("UPDATE scenes");
    expect(fake.executeCalls[0]?.bindValues).toEqual(
      expect.arrayContaining(["scene-1", "completed", "route-1"]),
    );
  });

  it("deleteScene 会清理 links、blocks 和 scene 主表", async () => {
    const fake = createFakeExecutor();
    const repository = createSqliteStoryRepository(fake.factory);

    await repository.deleteScene("scene-1");

    expect(fake.executeCalls.map((call) => call.sql)).toEqual([
      expect.stringContaining("DELETE FROM scene_links"),
      expect.stringContaining("DELETE FROM scene_blocks"),
      expect.stringContaining("DELETE FROM scenes"),
    ]);
    expect(fake.executeCalls.map((call) => call.bindValues)).toEqual([
      ["scene-1"],
      ["scene-1"],
      ["scene-1"],
    ]);
  });

  it("saveBlocks 会先清空旧块再写入新块", async () => {
    const fake = createFakeExecutor();
    const repository = createSqliteStoryRepository(fake.factory);

    await repository.saveBlocks("scene-1", [createBlock()]);

    expect(fake.executeCalls[0]?.sql).toContain("DELETE FROM scene_blocks");
    expect(fake.executeCalls[1]?.sql).toContain("INSERT INTO scene_blocks");
    expect(fake.executeCalls[1]?.bindValues).toEqual(
      expect.arrayContaining(["block-1", "scene-1", "dialogue", "你好"]),
    );
  });

  it("listLinks 会加载项目连线", async () => {
    const fake = createFakeExecutor([
      [
        {
          id: "link-1",
          project_id: "project-1",
          from_scene_id: "scene-1",
          to_scene_id: "scene-2",
          link_type: "choice",
          source_block_id: "block-1",
          label: "去旧校舍",
          condition_id: null,
          priority_order: 0,
        },
      ],
    ]);
    const repository = createSqliteStoryRepository(fake.factory);

    await expect(repository.listLinks("project-1")).resolves.toEqual([createLink()]);
    expect(fake.selectCalls[0]?.sql).toContain("FROM scene_links");
  });

  it("saveLinks 会按项目重写连线快照", async () => {
    const fake = createFakeExecutor();
    const repository = createSqliteStoryRepository(fake.factory);

    await repository.saveLinks("project-1", [createLink()]);

    expect(fake.executeCalls[0]?.sql).toContain("DELETE FROM scene_links");
    expect(fake.executeCalls[1]?.sql).toContain("INSERT INTO scene_links");
    expect(fake.executeCalls[1]?.bindValues).toEqual(
      expect.arrayContaining(["link-1", "project-1", "scene-1", "scene-2", "choice"]),
    );
  });
});
