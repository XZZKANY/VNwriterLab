import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Project } from "../domain/project";
import type { ProjectRepository } from "./projectRepository";
import {
  getProjectRepository,
  resetProjectRepositoryForTesting,
  setProjectRepositoryForTesting,
} from "./projectRepositoryRuntime";

// 防止意外触发 sqlite 仓储构造（依赖 @tauri-apps/plugin-sql）
vi.unmock("./sqliteProjectRepository");

function makeProject(overrides: Partial<Project> = {}): Project {
  return {
    id: "project-1",
    name: "雨夜回响",
    summary: "测试项目",
    projectType: "route_based",
    routes: [],
    scenes: [],
    ...overrides,
  };
}

function createFakeRepository(): ProjectRepository {
  return {
    listProjects: vi.fn(async () => []),
    getProject: vi.fn(async () => null),
    createProject: vi.fn(async (input) => input.project ?? makeProject()),
    updateProject: vi.fn(async () => undefined),
  };
}

describe("projectRepositoryRuntime — 切换/隔离", () => {
  beforeEach(() => {
    resetProjectRepositoryForTesting();
  });

  afterEach(() => {
    resetProjectRepositoryForTesting();
  });

  it("setProjectRepositoryForTesting 会覆盖 getProjectRepository 的返回", () => {
    const fake = createFakeRepository();
    setProjectRepositoryForTesting(fake);

    expect(getProjectRepository()).toBe(fake);
  });

  it("resetProjectRepositoryForTesting 会清掉 override 与缓存的 singleton", () => {
    const fake = createFakeRepository();
    setProjectRepositoryForTesting(fake);
    expect(getProjectRepository()).toBe(fake);

    resetProjectRepositoryForTesting();
    expect(getProjectRepository()).not.toBe(fake);
  });

  it("没有 Tauri 环境时返回 volatile 内存仓储（同一进程内是 singleton）", () => {
    const first = getProjectRepository();
    const second = getProjectRepository();
    expect(first).toBe(second);
  });
});

describe("projectRepositoryRuntime — volatile 内存仓储行为", () => {
  beforeEach(() => {
    resetProjectRepositoryForTesting();
  });

  afterEach(() => {
    resetProjectRepositoryForTesting();
  });

  it("初始 listProjects 为空", async () => {
    const repository = getProjectRepository();
    expect(await repository.listProjects()).toEqual([]);
  });

  it("createProject 接受外部 project 实例时直接存储该实例", async () => {
    const repository = getProjectRepository();
    const original = makeProject({ id: "p-x", name: "X" });
    const created = await repository.createProject({
      name: "X",
      summary: "",
      project: original,
    });

    expect(created).toBe(original);
    expect(await repository.listProjects()).toContain(original);
  });

  it("createProject 不传 project 时根据 name/summary/template 构造默认项目", async () => {
    const repository = getProjectRepository();
    const created = await repository.createProject({
      name: "雨夜回响",
      summary: "测试",
    });

    expect(created.name).toBe("雨夜回响");
    expect(created.summary).toBe("测试");
    expect(created.id).toMatch(/[0-9a-f-]{36}/i);
  });

  it("getProject 命中已写入的项目，未命中返回 null", async () => {
    const repository = getProjectRepository();
    const project = makeProject({ id: "p-1" });
    await repository.createProject({ name: "x", summary: "", project });

    expect(await repository.getProject("p-1")).toBe(project);
    expect(await repository.getProject("missing")).toBeNull();
  });

  it("updateProject 覆盖同 id 的现有记录", async () => {
    const repository = getProjectRepository();
    const initial = makeProject({ id: "p-1", name: "旧名" });
    await repository.createProject({
      name: "x",
      summary: "",
      project: initial,
    });

    const updated = makeProject({ id: "p-1", name: "新名" });
    await repository.updateProject(updated);

    expect(await repository.getProject("p-1")).toBe(updated);
  });

  it("listProjects 返回所有写入的项目", async () => {
    const repository = getProjectRepository();
    const a = makeProject({ id: "p-1", name: "A" });
    const b = makeProject({ id: "p-2", name: "B" });
    await repository.createProject({ name: "x", summary: "", project: a });
    await repository.createProject({ name: "x", summary: "", project: b });

    const list = await repository.listProjects();
    expect(list).toHaveLength(2);
    expect(list).toEqual(expect.arrayContaining([a, b]));
  });
});
