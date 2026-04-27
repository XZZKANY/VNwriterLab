import { describe, expect, it } from "vitest";
import type { Project } from "@/lib/domain/project";
import type { Scene } from "@/lib/domain/scene";
import type { ProjectVariable } from "@/lib/domain/variable";
import type { SceneLink } from "@/features/editor/store/linkUtils";
import {
  buildProjectExportPayload,
  exportProjectAsJson,
} from "./projectExport";
import { parseProjectImport } from "./projectImport";

function makeProject(overrides: Partial<Project> = {}): Project {
  return {
    id: "p1",
    name: "雨夜回响",
    summary: "测试项目",
    projectType: "route_based",
    routes: [
      {
        id: "r1",
        projectId: "p1",
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

function makeScene(overrides: Partial<Scene> = {}): Scene {
  return {
    id: "s1",
    projectId: "p1",
    routeId: "r1",
    title: "序章",
    summary: "",
    sceneType: "normal",
    status: "draft",
    chapterLabel: "",
    sortOrder: 0,
    isStartScene: true,
    isEndingScene: false,
    notes: "",
    blocks: [],
    ...overrides,
  };
}

function makeLink(overrides: Partial<SceneLink> = {}): SceneLink {
  return {
    id: "l1",
    projectId: "p1",
    fromSceneId: "s1",
    toSceneId: "s2",
    linkType: "choice",
    sourceBlockId: null,
    label: "",
    conditionId: null,
    priorityOrder: 0,
    ...overrides,
  };
}

function makeVariable(
  overrides: Partial<ProjectVariable> = {},
): ProjectVariable {
  return {
    id: "v1",
    projectId: "p1",
    name: "拥有钥匙",
    variableType: "flag",
    defaultValue: 0,
    ...overrides,
  };
}

describe("parseProjectImport", () => {
  it("空字符串返回解析失败", () => {
    expect(parseProjectImport("")).toEqual({
      ok: false,
      error: "导入内容为空。",
    });
    expect(parseProjectImport("   ")).toEqual({
      ok: false,
      error: "导入内容为空。",
    });
  });

  it("非 JSON 文本返回 JSON 解析失败", () => {
    const result = parseProjectImport("not valid json");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/JSON 解析失败/);
    }
  });

  it("顶层不是对象时拒绝", () => {
    expect(parseProjectImport(JSON.stringify([1, 2, 3]))).toEqual({
      ok: false,
      error: "顶层应为对象。",
    });
  });

  it.each([
    ["project", "缺少 project 字段。"],
    ["scenes", "缺少 scenes 字段。"],
    ["links", "缺少 links 字段。"],
    ["variables", "缺少 variables 字段。"],
  ])("缺失 %s 字段时报错", (field, expectedError) => {
    const full = {
      project: makeProject(),
      scenes: [],
      links: [],
      variables: [],
    } as Record<string, unknown>;
    delete full[field];

    const result = parseProjectImport(JSON.stringify(full));
    expect(result).toEqual({ ok: false, error: expectedError });
  });

  it("project 结构非法（缺 projectType）时报错", () => {
    const broken = {
      project: { id: "p1", name: "x", summary: "", routes: [], scenes: [] },
      scenes: [],
      links: [],
      variables: [],
    };
    const result = parseProjectImport(JSON.stringify(broken));
    expect(result).toEqual({ ok: false, error: "project 字段结构非法。" });
  });

  it("scenes 数组里出现非对象元素时报错", () => {
    const broken = {
      project: makeProject(),
      scenes: ["not an object"],
      links: [],
      variables: [],
    };
    const result = parseProjectImport(JSON.stringify(broken));
    expect(result).toEqual({ ok: false, error: "scenes 字段结构非法。" });
  });

  it("scene 的 projectId 与 project.id 不一致时报错", () => {
    const broken = {
      project: makeProject({ id: "p1" }),
      scenes: [makeScene({ projectId: "p2" })],
      links: [],
      variables: [],
    };
    const result = parseProjectImport(JSON.stringify(broken));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/scene .*不一致/);
    }
  });

  it("link 的 projectId 与 project.id 不一致时报错", () => {
    const broken = {
      project: makeProject(),
      scenes: [],
      links: [makeLink({ projectId: "p2" })],
      variables: [],
    };
    const result = parseProjectImport(JSON.stringify(broken));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/link .*不一致/);
    }
  });

  it("variable 的 projectId 与 project.id 不一致时报错", () => {
    const broken = {
      project: makeProject(),
      scenes: [],
      links: [],
      variables: [makeVariable({ projectId: "p2" })],
    };
    const result = parseProjectImport(JSON.stringify(broken));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/variable .*不一致/);
    }
  });

  it("buildProjectExportPayload + exportProjectAsJson 产出的内容能被 parseProjectImport 还原", () => {
    const project = makeProject({
      scenes: [makeScene()],
    });
    const scenes = [makeScene()];
    const links: SceneLink[] = [makeLink({ toSceneId: "s1" })];
    const variables = [makeVariable()];

    const json = exportProjectAsJson(
      buildProjectExportPayload({ project, scenes, links, variables }),
    );

    const result = parseProjectImport(json);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.payload.project.id).toBe("p1");
      expect(result.payload.scenes).toHaveLength(1);
      expect(result.payload.links).toHaveLength(1);
      expect(result.payload.variables).toHaveLength(1);
    }
  });
});
