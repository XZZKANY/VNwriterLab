import { afterEach, describe, expect, it, vi } from "vitest";
import type { Project } from "../domain/project";
import { createSqliteProjectRepository } from "./sqliteProjectRepository";
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

  return {
    selectCalls,
    executeCalls,
    factory: async () => executor,
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("createSqliteProjectRepository", () => {
  it("listProjects 在没有项目时返回空数组", async () => {
    const fake = createFakeExecutor([[]]);
    const repository = createSqliteProjectRepository(fake.factory);

    await expect(repository.listProjects()).resolves.toEqual([]);
    expect(fake.selectCalls).toHaveLength(1);
    expect(fake.selectCalls[0]?.sql).toContain("FROM projects");
  });

  it("getProject 会加载路线、场景与块", async () => {
    const fake = createFakeExecutor([
      [
        {
          id: "project-1",
          name: "雨夜回响",
          summary: "校园悬疑",
          project_type: "route_based",
        },
      ],
      [
        {
          id: "route-1",
          project_id: "project-1",
          name: "共通线",
          route_type: "common",
          description: "默认路线",
          sort_order: 0,
        },
      ],
      [
        {
          id: "scene-1",
          project_id: "project-1",
          route_id: "route-1",
          title: "开场",
          summary: "",
          scene_type: "normal",
          status: "draft",
          chapter_label: "",
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
          block_type: "narration",
          sort_order: 0,
          character_id: null,
          content_text: "下雨了",
          meta_json: null,
        },
      ],
    ]);
    const repository = createSqliteProjectRepository(fake.factory);

    const project = await repository.getProject("project-1");

    expect(project).toEqual({
      id: "project-1",
      name: "雨夜回响",
      summary: "校园悬疑",
      projectType: "route_based",
      routes: [
        {
          id: "route-1",
          projectId: "project-1",
          name: "共通线",
          routeType: "common",
          description: "默认路线",
          sortOrder: 0,
        },
      ],
      scenes: [
        {
          id: "scene-1",
          projectId: "project-1",
          routeId: "route-1",
          title: "开场",
          summary: "",
          sceneType: "normal",
          status: "draft",
          chapterLabel: "",
          sortOrder: 0,
          isStartScene: true,
          isEndingScene: false,
          notes: "",
          blocks: [
            {
              id: "block-1",
              sceneId: "scene-1",
              blockType: "narration",
              sortOrder: 0,
              characterId: null,
              contentText: "下雨了",
              metaJson: null,
            },
          ],
        },
      ],
    });
  });

  it("createProject 会按 createEmptyProject 语义写入项目和默认路线", async () => {
    const fake = createFakeExecutor();
    vi.spyOn(crypto, "randomUUID")
      .mockReturnValueOnce("project-0000-0000-0000-000000000001")
      .mockReturnValueOnce("route-0000-0000-0000-000000000001");

    const repository = createSqliteProjectRepository(fake.factory);
    const project = await repository.createProject({
      name: "雨夜回响",
      summary: "校园悬疑",
    });

    expect(project).toMatchObject({
      id: "project-0000-0000-0000-000000000001",
      name: "雨夜回响",
      summary: "校园悬疑",
      routes: [
        expect.objectContaining({
          id: "route-0000-0000-0000-000000000001",
          name: "共通线",
        }),
      ],
      scenes: [],
    });
    expect(fake.executeCalls[0]?.sql).toContain("INSERT INTO projects");
    expect(fake.executeCalls[1]?.sql).toContain("INSERT INTO routes");
    expect(fake.executeCalls[0]?.bindValues).toEqual(
      expect.arrayContaining([
        "project-0000-0000-0000-000000000001",
        "雨夜回响",
        "校园悬疑",
        "route_based",
      ]),
    );
  });

  it("updateProject 会重写路线、场景与块", async () => {
    const fake = createFakeExecutor();
    const repository = createSqliteProjectRepository(fake.factory);
    const project: Project = {
      id: "project-1",
      name: "雨夜回响",
      summary: "校园悬疑",
      projectType: "route_based",
      routes: [
        {
          id: "route-1",
          projectId: "project-1",
          name: "共通线",
          routeType: "common",
          description: "默认路线",
          sortOrder: 0,
        },
      ],
      scenes: [
        {
          id: "scene-1",
          projectId: "project-1",
          routeId: "route-1",
          title: "开场",
          summary: "",
          sceneType: "normal",
          status: "draft",
          chapterLabel: "第一章",
          sortOrder: 0,
          isStartScene: true,
          isEndingScene: false,
          notes: "",
          blocks: [
            {
              id: "block-1",
              sceneId: "scene-1",
              blockType: "note",
              sortOrder: 0,
              characterId: null,
              contentText: "备注",
              metaJson: null,
            },
          ],
        },
      ],
    };

    await repository.updateProject(project);

    expect(fake.executeCalls.map((call) => call.sql)).toEqual(
      expect.arrayContaining([
        expect.stringContaining("UPDATE projects"),
        expect.stringContaining("DELETE FROM scene_blocks"),
        expect.stringContaining("DELETE FROM scenes"),
        expect.stringContaining("DELETE FROM routes"),
        expect.stringContaining("INSERT INTO routes"),
        expect.stringContaining("INSERT INTO scenes"),
        expect.stringContaining("INSERT INTO scene_blocks"),
      ]),
    );
  });
});
