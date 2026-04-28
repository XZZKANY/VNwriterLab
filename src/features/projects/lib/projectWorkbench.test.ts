import { describe, expect, it } from "vitest";
import type { Project } from "@/lib/domain/project";
import type { Scene } from "@/lib/domain/scene";
import {
  buildProjectWorkbench,
  buildRouteSummaries,
  buildTodoItems,
  mergeProjectAndEditorScenes,
  resolveRecentScene,
  resolveStartScene,
} from "./projectWorkbench";

function makeScene(overrides: Partial<Scene>): Scene {
  return {
    id: "scene-1",
    projectId: "project-1",
    routeId: "route-1",
    title: "未命名场景",
    summary: "",
    sceneType: "normal",
    status: "draft",
    chapterLabel: "",
    sortOrder: 0,
    isStartScene: false,
    isEndingScene: false,
    notes: "",
    blocks: [],
    ...overrides,
  };
}

function makeProject(overrides: Partial<Project> = {}): Project {
  return {
    id: "project-1",
    name: "雨夜回响",
    summary: "",
    projectType: "route_based",
    routes: [
      {
        id: "route-1",
        projectId: "project-1",
        name: "主线",
        routeType: "common",
        description: "",
        sortOrder: 0,
      },
    ],
    scenes: [],
    ...overrides,
  };
}

describe("projectWorkbench helpers", () => {
  it("mergeProjectAndEditorScenes 用 editor 中的同 id 场景覆盖项目快照", () => {
    const projectScene = makeScene({
      id: "scene-1",
      title: "项目快照标题",
      sortOrder: 0,
    });
    const editorScene = makeScene({
      id: "scene-1",
      title: "编辑器最新标题",
      sortOrder: 0,
    });
    const project = makeProject({ scenes: [projectScene] });

    const merged = mergeProjectAndEditorScenes(project, [editorScene]);

    expect(merged).toHaveLength(1);
    expect(merged[0].title).toBe("编辑器最新标题");
  });

  it("mergeProjectAndEditorScenes 忽略其他项目的 editor 场景", () => {
    const project = makeProject({
      scenes: [makeScene({ id: "scene-1", title: "属于本项目" })],
    });
    const otherProjectScene = makeScene({
      id: "scene-2",
      projectId: "project-2",
      title: "属于其他项目",
    });

    const merged = mergeProjectAndEditorScenes(project, [otherProjectScene]);

    expect(merged.map((scene) => scene.id)).toEqual(["scene-1"]);
  });

  it("resolveRecentScene 优先选中 selectedSceneId", () => {
    const sceneA = makeScene({ id: "a", sortOrder: 0 });
    const sceneB = makeScene({ id: "b", sortOrder: 1 });

    expect(resolveRecentScene([sceneA, sceneB], "a")).toBe(sceneA);
  });

  it("resolveRecentScene 在没有选中或选中不存在时回退到最后一个场景", () => {
    const sceneA = makeScene({ id: "a", sortOrder: 0 });
    const sceneB = makeScene({ id: "b", sortOrder: 1 });

    expect(resolveRecentScene([sceneA, sceneB], null)).toBe(sceneB);
    expect(resolveRecentScene([sceneA, sceneB], "missing")).toBe(sceneB);
    expect(resolveRecentScene([], null)).toBeNull();
  });

  it("resolveStartScene 优先返回 isStartScene 的场景，否则返回第一个", () => {
    const sceneA = makeScene({ id: "a", sortOrder: 0 });
    const sceneB = makeScene({ id: "b", sortOrder: 1, isStartScene: true });

    expect(resolveStartScene([sceneA, sceneB])).toBe(sceneB);
    expect(resolveStartScene([sceneA])).toBe(sceneA);
    expect(resolveStartScene([])).toBeNull();
  });

  it("resolveStartScene 在未排序输入下也按 sortOrder 兜底", () => {
    const later = makeScene({ id: "later", sortOrder: 3 });
    const earlier = makeScene({ id: "earlier", sortOrder: 1 });
    const middle = makeScene({ id: "middle", sortOrder: 2 });

    // 输入故意逆序，没有 isStartScene 标记 —— 仍应返回 sortOrder 最小的 earlier
    expect(resolveStartScene([later, middle, earlier])).toBe(earlier);
  });

  it("resolveStartScene 即使有 isStartScene 标记仍优先它，忽略 sortOrder", () => {
    const flagged = makeScene({ id: "flag", sortOrder: 9, isStartScene: true });
    const earlier = makeScene({ id: "earlier", sortOrder: 0 });

    expect(resolveStartScene([earlier, flagged])).toBe(flagged);
  });

  it("buildTodoItems 计算三种待处理状态的场景数", () => {
    const scenes = [
      makeScene({ id: "1", status: "needs_revision" }),
      makeScene({ id: "2", status: "needs_supplement" }),
      makeScene({ id: "3", status: "needs_logic_check" }),
      makeScene({ id: "4", status: "needs_revision" }),
      makeScene({ id: "5", status: "draft" }),
      makeScene({ id: "6", status: "completed" }),
    ];

    expect(buildTodoItems(scenes)).toEqual([
      { label: "待修改", value: 2 },
      { label: "待补充", value: 1 },
      { label: "待检查逻辑", value: 1 },
    ]);
  });

  it("buildRouteSummaries 按 sortOrder 排序并统计每条路线的场景数", () => {
    const scenes = [
      makeScene({ id: "s1", routeId: "r1" }),
      makeScene({ id: "s2", routeId: "r1" }),
      makeScene({ id: "s3", routeId: "r2" }),
    ];

    const summaries = buildRouteSummaries(
      [
        {
          id: "r2",
          projectId: "p1",
          name: "支线",
          routeType: "character",
          description: "",
          sortOrder: 1,
        },
        {
          id: "r1",
          projectId: "p1",
          name: "主线",
          routeType: "common",
          description: "",
          sortOrder: 0,
        },
      ],
      scenes,
    );

    expect(summaries).toEqual([
      { routeId: "r1", routeName: "主线", sceneCount: 2 },
      { routeId: "r2", routeName: "支线", sceneCount: 1 },
    ]);
  });

  it("buildProjectWorkbench 集成产出 summaryCards / todoItems / routeSummaries / stats", () => {
    const project = makeProject({
      scenes: [
        makeScene({ id: "1", status: "draft", sortOrder: 0 }),
        makeScene({ id: "2", status: "needs_revision", sortOrder: 1 }),
      ],
    });

    const workbench = buildProjectWorkbench({
      project,
      editorScenes: [],
      links: [],
      variables: [],
      characters: [],
      loreEntries: [],
      selectedSceneId: null,
    });

    expect(workbench.summaryCards).toEqual([
      { label: "路线数", value: "1" },
      { label: "场景总数", value: "2" },
      { label: "待修改", value: "1" },
      { label: "待检查逻辑", value: "0" },
    ]);
    expect(workbench.todoItems).toEqual([
      { label: "待修改", value: 1 },
      { label: "待补充", value: 0 },
      { label: "待检查逻辑", value: 0 },
    ]);
    expect(workbench.routeSummaries).toHaveLength(1);
    expect(workbench.stats.routeCount).toBe(1);
  });
});
