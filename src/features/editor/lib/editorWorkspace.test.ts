import { describe, expect, it } from "vitest";
import type { Project } from "@/lib/domain/project";
import type { Scene } from "@/lib/domain/scene";
import type { ProjectVariable } from "@/lib/domain/variable";
import { buildEditorWorkspace } from "./editorWorkspace";

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

function makeVariable(overrides: Partial<ProjectVariable>): ProjectVariable {
  return {
    id: "v1",
    projectId: "project-1",
    name: "变量",
    variableType: "flag",
    defaultValue: 0,
    ...overrides,
  };
}

const project: Project = {
  id: "project-1",
  name: "雨夜回响",
  summary: "",
  projectType: "route_based",
  routes: [],
  scenes: [],
};

describe("buildEditorWorkspace", () => {
  it("仅返回当前项目的场景", () => {
    const sceneA = makeScene({ id: "a", projectId: "project-1" });
    const sceneB = makeScene({ id: "b", projectId: "other-project" });

    const workspace = buildEditorWorkspace({
      currentProject: project,
      scenes: [sceneA, sceneB],
      variables: [],
      selectedSceneId: null,
      selectedVariableId: null,
    });

    expect(workspace.visibleScenes.map((s) => s.id)).toEqual(["a"]);
  });

  it("无项目时返回所有场景，且 projectVariables 为空", () => {
    const sceneA = makeScene({ id: "a", projectId: "p1" });
    const sceneB = makeScene({ id: "b", projectId: "p2" });

    const workspace = buildEditorWorkspace({
      currentProject: null,
      scenes: [sceneA, sceneB],
      variables: [makeVariable({ id: "v1" })],
      selectedSceneId: null,
      selectedVariableId: null,
    });

    expect(workspace.visibleScenes).toHaveLength(2);
    expect(workspace.projectVariables).toEqual([]);
  });

  it("根据 selectedSceneId 选中场景，未匹配时为 null", () => {
    const sceneA = makeScene({ id: "a", projectId: "project-1" });

    expect(
      buildEditorWorkspace({
        currentProject: project,
        scenes: [sceneA],
        variables: [],
        selectedSceneId: "a",
        selectedVariableId: null,
      }).selectedScene,
    ).toBe(sceneA);

    expect(
      buildEditorWorkspace({
        currentProject: project,
        scenes: [sceneA],
        variables: [],
        selectedSceneId: "missing",
        selectedVariableId: null,
      }).selectedScene,
    ).toBeNull();
  });

  it("selectedVariable 优先匹配 selectedVariableId，否则回退到第一个变量", () => {
    const v1 = makeVariable({ id: "v1" });
    const v2 = makeVariable({ id: "v2" });

    expect(
      buildEditorWorkspace({
        currentProject: project,
        scenes: [],
        variables: [v1, v2],
        selectedSceneId: null,
        selectedVariableId: "v2",
      }).selectedVariable,
    ).toBe(v2);

    expect(
      buildEditorWorkspace({
        currentProject: project,
        scenes: [],
        variables: [v1, v2],
        selectedSceneId: null,
        selectedVariableId: null,
      }).selectedVariable,
    ).toBe(v1);

    expect(
      buildEditorWorkspace({
        currentProject: project,
        scenes: [],
        variables: [],
        selectedSceneId: null,
        selectedVariableId: null,
      }).selectedVariable,
    ).toBeNull();
  });

  it("仅返回当前项目下的变量", () => {
    const v1 = makeVariable({ id: "v1", projectId: "project-1" });
    const v2 = makeVariable({ id: "v2", projectId: "other-project" });

    const workspace = buildEditorWorkspace({
      currentProject: project,
      scenes: [],
      variables: [v1, v2],
      selectedSceneId: null,
      selectedVariableId: null,
    });

    expect(workspace.projectVariables.map((v) => v.id)).toEqual(["v1"]);
  });
});
