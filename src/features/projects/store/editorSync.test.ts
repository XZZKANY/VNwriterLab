import { beforeEach, describe, expect, it } from "vitest";
import type { Project } from "@/lib/domain/project";
import type { Scene } from "@/lib/domain/scene";
import type { ProjectVariable } from "@/lib/domain/variable";
import { stringifyChoiceBlockMeta } from "@/features/editor/store/choiceBlock";
import type { SceneLink } from "@/features/editor/store/linkUtils";
import { useEditorStore } from "@/features/editor/store/useEditorStore";
import {
  readEditorSelectedSceneId,
  replaceEditorOnProjectCreate,
  replaceEditorOnProjectImport,
  syncEditorAfterSceneDelete,
  syncEditorAfterSceneRearrangement,
  syncEditorAfterSceneUpdate,
  syncEditorOnProjectHydrate,
} from "./editorSync";

function makeProject(overrides: Partial<Project> = {}): Project {
  return {
    id: "p1",
    name: "项目",
    summary: "",
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
    title: "未命名",
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

function makeVariable(
  overrides: Partial<ProjectVariable> = {},
): ProjectVariable {
  return {
    id: "v1",
    projectId: "p1",
    name: "var",
    variableType: "flag",
    defaultValue: 0,
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
    sourceBlockId: "b1",
    label: "",
    conditionId: null,
    priorityOrder: 0,
    ...overrides,
  };
}

describe("syncEditorOnProjectHydrate", () => {
  beforeEach(() => {
    useEditorStore.getState().resetEditor();
  });

  it("editor 初始为空时直接载入项目场景", () => {
    const project = makeProject({
      scenes: [makeScene({ id: "s1" }), makeScene({ id: "s2" })],
    });
    syncEditorOnProjectHydrate(project);

    const state = useEditorStore.getState();
    expect(state.scenes.map((scene) => scene.id)).toEqual(["s1", "s2"]);
    expect(state.selectedSceneId).toBe("s1");
  });

  it("editor 已有同 projectId 场景时合并保留，并按项目元数据对齐", () => {
    const project = makeProject({
      scenes: [makeScene({ id: "s1", title: "新标题" })],
    });
    useEditorStore.setState({
      scenes: [makeScene({ id: "s1", title: "旧标题" })],
      selectedSceneId: "s1",
      links: [],
      variables: [],
      selectedVariableId: null,
    });

    syncEditorOnProjectHydrate(project);

    const state = useEditorStore.getState();
    expect(state.scenes[0]?.title).toBe("新标题");
    expect(state.selectedSceneId).toBe("s1");
  });

  it("editor 中已选中的 sceneId 不在新项目中时回退到列表首项", () => {
    const project = makeProject({
      scenes: [makeScene({ id: "s1" })],
    });
    useEditorStore.setState({
      scenes: [makeScene({ id: "ghost" })],
      selectedSceneId: "ghost",
      links: [],
      variables: [],
      selectedVariableId: null,
    });

    syncEditorOnProjectHydrate(project);

    expect(useEditorStore.getState().selectedSceneId).toBe("s1");
  });

  it("links 中两端都不在新项目场景中的会被剪掉", () => {
    const project = makeProject({
      scenes: [makeScene({ id: "s1" }), makeScene({ id: "s2" })],
    });
    useEditorStore.setState({
      scenes: [],
      selectedSceneId: null,
      links: [
        makeLink({ id: "keep", fromSceneId: "s1", toSceneId: "s2" }),
        makeLink({ id: "drop", fromSceneId: "ghost-a", toSceneId: "ghost-b" }),
      ],
      variables: [],
      selectedVariableId: null,
    });

    syncEditorOnProjectHydrate(project);

    expect(useEditorStore.getState().links.map((link) => link.id)).toEqual([
      "keep",
    ]);
  });

  it("variables 中不属于该项目的会被剪掉", () => {
    const project = makeProject();
    useEditorStore.setState({
      scenes: [],
      selectedSceneId: null,
      links: [],
      variables: [
        makeVariable({ id: "v1", projectId: "p1" }),
        makeVariable({ id: "v2", projectId: "other" }),
      ],
      selectedVariableId: "v1",
    });

    syncEditorOnProjectHydrate(project);

    const state = useEditorStore.getState();
    expect(state.variables.map((v) => v.id)).toEqual(["v1"]);
    expect(state.selectedVariableId).toBe("v1");
  });
});

describe("replaceEditorOnProjectCreate", () => {
  beforeEach(() => {
    useEditorStore.getState().resetEditor();
  });

  it("把 editor 重置为项目的初始场景，links/variables 清空", () => {
    useEditorStore.setState({
      scenes: [makeScene({ id: "ghost" })],
      selectedSceneId: "ghost",
      links: [makeLink()],
      variables: [makeVariable()],
      selectedVariableId: "v1",
    });

    replaceEditorOnProjectCreate(
      makeProject({ scenes: [makeScene({ id: "s1" })] }),
    );

    const state = useEditorStore.getState();
    expect(state.scenes.map((s) => s.id)).toEqual(["s1"]);
    expect(state.selectedSceneId).toBe("s1");
    expect(state.links).toEqual([]);
    expect(state.variables).toEqual([]);
    expect(state.selectedVariableId).toBeNull();
  });

  it("项目初始无场景时 selectedSceneId 为 null", () => {
    replaceEditorOnProjectCreate(makeProject({ scenes: [] }));
    expect(useEditorStore.getState().selectedSceneId).toBeNull();
  });
});

describe("replaceEditorOnProjectImport", () => {
  beforeEach(() => {
    useEditorStore.getState().resetEditor();
  });

  it("用导入的 scenes/links/variables 完整替换 editor", () => {
    const scenes = [makeScene({ id: "s1" }), makeScene({ id: "s2" })];
    const links = [makeLink({ id: "l1" })];
    const variables = [makeVariable({ id: "v1" })];

    replaceEditorOnProjectImport({ scenes, links, variables });

    const state = useEditorStore.getState();
    expect(state.scenes).toEqual(scenes);
    expect(state.links).toEqual(links);
    expect(state.variables).toEqual(variables);
    expect(state.selectedSceneId).toBe("s1");
    expect(state.selectedVariableId).toBe("v1");
  });

  it("scenes / variables 为空时 selectedXxxId 为 null", () => {
    replaceEditorOnProjectImport({ scenes: [], links: [], variables: [] });

    const state = useEditorStore.getState();
    expect(state.selectedSceneId).toBeNull();
    expect(state.selectedVariableId).toBeNull();
  });
});

describe("syncEditorAfterSceneRearrangement", () => {
  beforeEach(() => {
    useEditorStore.getState().resetEditor();
  });

  it("仅同步 scenes，不动 selectedSceneId / links / variables", () => {
    useEditorStore.setState({
      scenes: [
        makeScene({ id: "s1", sortOrder: 0 }),
        makeScene({ id: "s2", sortOrder: 1 }),
      ],
      selectedSceneId: "s2",
      links: [makeLink({ id: "l1" })],
      variables: [makeVariable({ id: "v1" })],
      selectedVariableId: "v1",
    });

    const project = makeProject();
    syncEditorAfterSceneRearrangement(project.routes, [
      makeScene({ id: "s2", sortOrder: 0, isStartScene: true }),
      makeScene({ id: "s1", sortOrder: 1, isStartScene: false }),
    ]);

    const state = useEditorStore.getState();
    expect(state.scenes.map((s) => s.id)).toEqual(["s2", "s1"]);
    expect(state.selectedSceneId).toBe("s2");
    expect(state.links).toHaveLength(1);
    expect(state.variables).toHaveLength(1);
  });
});

describe("syncEditorAfterSceneUpdate", () => {
  beforeEach(() => {
    useEditorStore.getState().resetEditor();
  });

  it("场景标题更新后能被同步", () => {
    useEditorStore.setState({
      scenes: [makeScene({ id: "s1", title: "旧" })],
      selectedSceneId: "s1",
      links: [],
      variables: [],
      selectedVariableId: null,
    });

    const project = makeProject();
    syncEditorAfterSceneUpdate(project.routes, [
      makeScene({ id: "s1", title: "新" }),
    ]);

    expect(useEditorStore.getState().scenes[0]?.title).toBe("新");
  });

  it("当前 selectedSceneId 不在新场景集时回退到列表首项", () => {
    useEditorStore.setState({
      scenes: [makeScene({ id: "ghost" })],
      selectedSceneId: "ghost",
      links: [],
      variables: [],
      selectedVariableId: null,
    });

    const project = makeProject();
    syncEditorAfterSceneUpdate(project.routes, [makeScene({ id: "s1" })]);

    expect(useEditorStore.getState().selectedSceneId).toBe("s1");
  });

  it("nextScenes 为空时 selectedSceneId 设为 null", () => {
    useEditorStore.setState({
      scenes: [makeScene({ id: "s1" })],
      selectedSceneId: "s1",
      links: [],
      variables: [],
      selectedVariableId: null,
    });

    const project = makeProject();
    syncEditorAfterSceneUpdate(project.routes, []);

    expect(useEditorStore.getState().selectedSceneId).toBeNull();
  });
});

describe("syncEditorAfterSceneDelete", () => {
  beforeEach(() => {
    useEditorStore.getState().resetEditor();
  });

  it("清理掉指向被删场景的 choice metaJson 与 links", () => {
    const choiceMetaJson = stringifyChoiceBlockMeta({
      label: "去 s2",
      targetSceneId: "s2",
      effectVariableId: null,
      effectValue: 0,
    });
    useEditorStore.setState({
      scenes: [
        makeScene({
          id: "s1",
          blocks: [
            {
              id: "b1",
              sceneId: "s1",
              blockType: "choice",
              sortOrder: 0,
              characterId: null,
              contentText: "去 s2",
              metaJson: choiceMetaJson,
            },
          ],
        }),
      ],
      selectedSceneId: "s1",
      links: [
        makeLink({ id: "keep", fromSceneId: "s1", toSceneId: "s1" }),
        makeLink({ id: "drop", fromSceneId: "s1", toSceneId: "s2" }),
      ],
      variables: [],
      selectedVariableId: null,
    });

    const project = makeProject();
    syncEditorAfterSceneDelete({
      routes: project.routes,
      normalizedScenes: [makeScene({ id: "s1" })],
      deletedSceneId: "s2",
      nextSelectedSceneId: "s1",
    });

    const state = useEditorStore.getState();
    const cleanedMetaJson = state.scenes[0]?.blocks[0]?.metaJson;
    expect(cleanedMetaJson).not.toBeNull();
    expect(JSON.parse(cleanedMetaJson!)).toMatchObject({
      targetSceneId: null,
      label: "去 s2",
    });
    expect(state.links.map((link) => link.id)).toEqual(["keep"]);
    expect(state.selectedSceneId).toBe("s1");
  });
});

describe("readEditorSelectedSceneId", () => {
  beforeEach(() => {
    useEditorStore.getState().resetEditor();
  });

  it("返回当前 editor.selectedSceneId 的值", () => {
    useEditorStore.setState({
      scenes: [makeScene({ id: "s1" })],
      selectedSceneId: "s1",
      links: [],
      variables: [],
      selectedVariableId: null,
    });
    expect(readEditorSelectedSceneId()).toBe("s1");
  });

  it("没有选中场景时返回 null", () => {
    expect(readEditorSelectedSceneId()).toBeNull();
  });
});
