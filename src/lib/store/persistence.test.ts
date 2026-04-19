import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Character } from "../domain/character";
import type { LoreEntry } from "../domain/lore";
import type { Project, ProjectTemplate } from "../domain/project";
import type { SceneBlock } from "../domain/block";
import type { SceneLink } from "../domain/link";
import type { Scene } from "../domain/scene";
import type { ProjectVariable } from "../domain/variable";

const EDITOR_STORAGE_KEY = "vn-writer-lab.editor-store";

function createFakeProjectRepository(initialProjects: Project[] = []) {
  const projects = new Map(initialProjects.map((project) => [project.id, project]));
  const listProjects = vi.fn(async () => [...projects.values()]);
  const getProject = vi.fn(async (projectId: string) => projects.get(projectId) ?? null);
  const createProject = vi.fn(
    async (input: {
      name: string;
      summary: string;
      template?: ProjectTemplate;
      project?: Project;
    }) => {
      const project = input.project!;
      projects.set(project.id, project);
      return project;
    },
  );
  const updateProject = vi.fn(async (project: Project) => {
    projects.set(project.id, project);
  });

  return {
    repository: {
      listProjects,
      getProject,
      createProject,
      updateProject,
    },
    createProject,
    updateProject,
  };
}

async function setFakeProjectRepository(repository: {
  listProjects: () => Promise<Project[]>;
  getProject: (projectId: string) => Promise<Project | null>;
  createProject: (input: {
    name: string;
    summary: string;
    template?: ProjectTemplate;
    project?: Project;
  }) => Promise<Project>;
  updateProject: (project: Project) => Promise<void>;
}) {
  const runtime = await import("../repositories/projectRepositoryRuntime");
  runtime.setProjectRepositoryForTesting(repository);
}

function createFakeReferenceRepository(input?: {
  characters?: Character[];
  loreEntries?: LoreEntry[];
  variables?: ProjectVariable[];
}) {
  const characters = new Map(
    (input?.characters ?? []).map((character) => [character.id, character]),
  );
  const loreEntries = new Map(
    (input?.loreEntries ?? []).map((entry) => [entry.id, entry]),
  );
  const variables = new Map(
    (input?.variables ?? []).map((variable) => [variable.id, variable]),
  );

  return {
    repository: {
      listCharacters: vi.fn(async (projectId: string) =>
        [...characters.values()].filter((character) => character.projectId === projectId),
      ),
      saveCharacter: vi.fn(async (character: Character) => {
        characters.set(character.id, character);
      }),
      listLoreEntries: vi.fn(async (projectId: string) =>
        [...loreEntries.values()].filter((entry) => entry.projectId === projectId),
      ),
      saveLoreEntry: vi.fn(async (entry: LoreEntry) => {
        loreEntries.set(entry.id, entry);
      }),
      listVariables: vi.fn(async (projectId: string) =>
        [...variables.values()].filter((variable) => variable.projectId === projectId),
      ),
      saveVariable: vi.fn(async (variable: ProjectVariable) => {
        variables.set(variable.id, variable);
      }),
      saveVariables: vi.fn(
        async (projectId: string, nextVariables: ProjectVariable[]) => {
          for (const variable of [...variables.values()]) {
            if (variable.projectId === projectId) {
              variables.delete(variable.id);
            }
          }

          for (const variable of nextVariables) {
            variables.set(variable.id, variable);
          }
        },
      ),
    },
  };
}

async function setFakeReferenceRepository(repository: {
  listCharacters: (projectId: string) => Promise<Character[]>;
  saveCharacter: (character: Character) => Promise<void>;
  listLoreEntries: (projectId: string) => Promise<LoreEntry[]>;
  saveLoreEntry: (entry: LoreEntry) => Promise<void>;
  listVariables: (projectId: string) => Promise<ProjectVariable[]>;
  saveVariable: (variable: ProjectVariable) => Promise<void>;
  saveVariables: (
    projectId: string,
    variables: ProjectVariable[],
  ) => Promise<void>;
}) {
  const runtime = await import("../repositories/referenceRepositoryRuntime");
  runtime.setReferenceRepositoryForTesting(repository);
}

function createTestScene(overrides: Partial<Scene> = {}): Scene {
  return {
    id: "scene-1",
    projectId: "p1",
    routeId: "route-1",
    title: "旧校舍入口",
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

function createFakeStoryRepository(initialScenes: Scene[] = []) {
  const scenes = new Map(initialScenes.map((scene) => [scene.id, scene]));
  const links = new Map<string, SceneLink>();
  const saveBlocks = vi.fn(async (sceneId: string, blocks: SceneBlock[]) => {
    const scene = scenes.get(sceneId);
    if (!scene) {
      return;
    }

    scenes.set(sceneId, {
      ...scene,
      blocks,
    });
  });

  return {
    repository: {
      listScenes: vi.fn(async (projectId: string) =>
        [...scenes.values()].filter((scene) => scene.projectId === projectId),
      ),
      createScene: vi.fn(async () => createTestScene()),
      updateScene: vi.fn(async (scene: Scene) => {
        scenes.set(scene.id, {
          ...scene,
          blocks: scenes.get(scene.id)?.blocks ?? scene.blocks,
        });
      }),
      deleteScene: vi.fn(async (sceneId: string) => {
        scenes.delete(sceneId);
      }),
      saveBlocks,
      listLinks: vi.fn(async (projectId: string) =>
        [...links.values()].filter((link) => link.projectId === projectId),
      ),
      saveLinks: vi.fn(async (projectId: string, nextLinks: SceneLink[]) => {
        for (const link of [...links.values()]) {
          if (link.projectId === projectId) {
            links.delete(link.id);
          }
        }

        for (const link of nextLinks) {
          links.set(link.id, link);
        }
      }),
    },
    saveBlocks,
  };
}

async function setFakeStoryRepository(repository: {
  listScenes: (projectId: string) => Promise<Scene[]>;
  createScene: (
    input: Pick<Scene, "projectId" | "routeId" | "title" | "chapterLabel"> & {
      scene?: Scene;
    },
  ) => Promise<Scene>;
  updateScene: (scene: Scene) => Promise<void>;
  deleteScene: (sceneId: string) => Promise<void>;
  saveBlocks: (sceneId: string, blocks: SceneBlock[]) => Promise<void>;
  listLinks: (projectId: string) => Promise<SceneLink[]>;
  saveLinks: (projectId: string, links: SceneLink[]) => Promise<void>;
}) {
  const runtime = await import("../repositories/storyRepositoryRuntime");
  runtime.setStoryRepositoryForTesting(repository);
}

describe("store persistence", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetModules();
  });

  it("创建项目后会持久化并在重载后恢复", async () => {
    const fake = createFakeProjectRepository();
    await setFakeProjectRepository(fake.repository);

    const [{ useProjectStore }, { useAutoSaveStore }] = await Promise.all([
      import("../../features/projects/store/useProjectStore"),
      import("./useAutoSaveStore"),
    ]);

    useProjectStore.getState().createProject("雨夜回响", "一段校园悬疑故事");

    expect(fake.createProject).toHaveBeenCalledTimes(1);
    expect(useAutoSaveStore.getState().lastSavedAt).not.toBeNull();

    vi.resetModules();
    await setFakeProjectRepository(fake.repository);

    const { useProjectStore: reloadedProjectStore } = await import(
      "../../features/projects/store/useProjectStore"
    );
    await reloadedProjectStore.getState().hydrateLatestProject();

    expect(reloadedProjectStore.getState().currentProject?.name).toBe("雨夜回响");
    expect(reloadedProjectStore.getState().currentProject?.summary).toBe(
      "一段校园悬疑故事",
    );
  });

  it("新增路线和按路线创建场景后会在重载后恢复结构", async () => {
    const fake = createFakeProjectRepository();
    await setFakeProjectRepository(fake.repository);

    const [{ useProjectStore }, { useAutoSaveStore }] = await Promise.all([
      import("../../features/projects/store/useProjectStore"),
      import("./useAutoSaveStore"),
    ]);

    useProjectStore.getState().createProject("雨夜回响", "一段校园悬疑故事");

    const defaultRouteId =
      useProjectStore.getState().currentProject?.routes[0]?.id ?? "";

    useProjectStore.getState().createRoute("林夏线");

    const secondRouteId =
      useProjectStore.getState().currentProject?.routes[1]?.id ?? "";

    useProjectStore.getState().createSceneInRoute(defaultRouteId);
    useProjectStore.getState().createSceneInRoute(secondRouteId);

    expect(fake.updateProject).toHaveBeenCalled();
    expect(useAutoSaveStore.getState().lastSavedAt).not.toBeNull();

    vi.resetModules();
    await setFakeProjectRepository(fake.repository);

    const { useProjectStore: reloadedProjectStore } = await import(
      "../../features/projects/store/useProjectStore"
    );
    await reloadedProjectStore.getState().hydrateLatestProject();

    expect(reloadedProjectStore.getState().currentProject?.routes).toHaveLength(2);
    expect(reloadedProjectStore.getState().currentProject?.scenes).toHaveLength(2);
    expect(
      reloadedProjectStore.getState().currentProject?.scenes.map(
        (scene) => scene.routeId,
      ),
    ).toEqual([defaultRouteId, secondRouteId]);
  });

  it("创建场景和内容块后会持久化并在重载后恢复", async () => {
    const scene = createTestScene();
    const fakeStory = createFakeStoryRepository([scene]);
    await setFakeStoryRepository(fakeStory.repository);

    const [{ useEditorStore }, { useAutoSaveStore }] = await Promise.all([
      import("../../features/editor/store/useEditorStore"),
      import("./useAutoSaveStore"),
    ]);

    useEditorStore.getState().importScene(scene);
    useEditorStore.getState().addBlock("narration");

    expect(localStorage.getItem(EDITOR_STORAGE_KEY)).toBeNull();
    expect(fakeStory.saveBlocks).toHaveBeenCalled();
    expect(useAutoSaveStore.getState().lastSavedAt).not.toBeNull();

    vi.resetModules();
    await setFakeStoryRepository(fakeStory.repository);

    const { useEditorStore: reloadedEditorStore } = await import(
      "../../features/editor/store/useEditorStore"
    );
    await reloadedEditorStore.getState().hydrateScenes("p1");

    expect(reloadedEditorStore.getState().scenes).toHaveLength(1);
    expect(reloadedEditorStore.getState().scenes[0]?.blocks).toHaveLength(1);
    expect(reloadedEditorStore.getState().selectedSceneId).toBe(
      reloadedEditorStore.getState().scenes[0]?.id,
    );
  });

  it("创建角色后会持久化并在重载后恢复", async () => {
    const fakeProject = createFakeProjectRepository();
    await setFakeProjectRepository(fakeProject.repository);
    const [{ useProjectStore }, { useCharacterStore }, { useAutoSaveStore }] =
      await Promise.all([
        import("../../features/projects/store/useProjectStore"),
        import("../../features/characters/store/useCharacterStore"),
        import("./useAutoSaveStore"),
      ]);
    const fakeReference = createFakeReferenceRepository();
    await setFakeReferenceRepository(fakeReference.repository);

    useProjectStore.getState().createProject("雨夜回响", "一段校园悬疑故事");
    useCharacterStore.getState().createCharacter(
      useProjectStore.getState().currentProject!.id,
    );
    useCharacterStore.getState().updateCharacter(
      useCharacterStore.getState().selectedCharacterId!,
      {
        name: "林夏",
      },
    );

    expect(fakeReference.repository.saveCharacter).toHaveBeenCalled();
    expect(useAutoSaveStore.getState().lastSavedAt).not.toBeNull();

    vi.resetModules();
    await setFakeProjectRepository(fakeProject.repository);
    await setFakeReferenceRepository(fakeReference.repository);
    const { useProjectStore: reloadedProjectStore } = await import(
      "../../features/projects/store/useProjectStore"
    );
    await reloadedProjectStore.getState().hydrateLatestProject();

    const { useCharacterStore: reloadedCharacterStore } = await import(
      "../../features/characters/store/useCharacterStore"
    );
    await reloadedCharacterStore
      .getState()
      .hydrateCharacters(reloadedProjectStore.getState().currentProject!.id);

    expect(reloadedCharacterStore.getState().characters).toHaveLength(1);
    expect(reloadedCharacterStore.getState().characters[0]?.name).toBe("林夏");
    expect(reloadedCharacterStore.getState().selectedCharacterId).toBe(
      reloadedCharacterStore.getState().characters[0]?.id,
    );
  });

  it("创建设定后会持久化并在重载后恢复", async () => {
    const fakeProject = createFakeProjectRepository();
    await setFakeProjectRepository(fakeProject.repository);
    const [{ useProjectStore }, { useLoreStore }, { useAutoSaveStore }] =
      await Promise.all([
        import("../../features/projects/store/useProjectStore"),
        import("../../features/lore/store/useLoreStore"),
        import("./useAutoSaveStore"),
      ]);
    const fakeReference = createFakeReferenceRepository();
    await setFakeReferenceRepository(fakeReference.repository);

    useProjectStore.getState().createProject("雨夜回响", "一段校园悬疑故事");
    useLoreStore.getState().createLoreEntry(
      useProjectStore.getState().currentProject!.id,
    );
    useLoreStore.getState().updateLoreEntry(
      useLoreStore.getState().selectedLoreId!,
      {
        name: "旧校舍",
      },
    );

    expect(fakeReference.repository.saveLoreEntry).toHaveBeenCalled();
    expect(useAutoSaveStore.getState().lastSavedAt).not.toBeNull();

    vi.resetModules();
    await setFakeProjectRepository(fakeProject.repository);
    await setFakeReferenceRepository(fakeReference.repository);
    const { useProjectStore: reloadedProjectStore } = await import(
      "../../features/projects/store/useProjectStore"
    );
    await reloadedProjectStore.getState().hydrateLatestProject();

    const { useLoreStore: reloadedLoreStore } = await import(
      "../../features/lore/store/useLoreStore"
    );
    await reloadedLoreStore
      .getState()
      .hydrateLoreEntries(reloadedProjectStore.getState().currentProject!.id);

    expect(reloadedLoreStore.getState().entries).toHaveLength(1);
    expect(reloadedLoreStore.getState().entries[0]?.name).toBe("旧校舍");
    expect(reloadedLoreStore.getState().selectedLoreId).toBe(
      reloadedLoreStore.getState().entries[0]?.id,
    );
  });
  it("新增变量并配置条件块后会在重载后恢复", async () => {
    const fakeReference = createFakeReferenceRepository();
    await setFakeReferenceRepository(fakeReference.repository);
    const scene = createTestScene();
    const fakeStory = createFakeStoryRepository([scene]);
    await setFakeStoryRepository(fakeStory.repository);
    const [{ useEditorStore }, { useAutoSaveStore }] = await Promise.all([
      import("../../features/editor/store/useEditorStore"),
      import("./useAutoSaveStore"),
    ]);

    useEditorStore.getState().importScene(scene);
    useEditorStore.getState().createVariable("p1");

    const variableId = useEditorStore.getState().variables[0]?.id ?? "";

    useEditorStore.getState().updateVariable(variableId, {
      name: "拥有钥匙",
      variableType: "flag",
      defaultValue: 1,
    });
    useEditorStore.getState().selectScene(scene.id);
    useEditorStore.getState().addBlock("condition");

    const blockId = useEditorStore.getState().scenes[0]?.blocks[0]?.id ?? "";

    useEditorStore.getState().updateConditionBlock(scene.id, blockId, {
      conditions: [
        {
          variableId,
          operator: "isTrue",
          compareValue: 1,
        },
      ],
    });

      expect(localStorage.getItem(EDITOR_STORAGE_KEY)).toBeNull();
      expect(fakeReference.repository.saveVariables).toHaveBeenCalled();
      expect(useAutoSaveStore.getState().lastSavedAt).not.toBeNull();
  
      vi.resetModules();
      await setFakeReferenceRepository(fakeReference.repository);
      await setFakeStoryRepository(fakeStory.repository);
  
      const { useEditorStore: reloadedEditorStore } = await import(
        "../../features/editor/store/useEditorStore"
      );
      await reloadedEditorStore.getState().hydrateScenes("p1");
      await reloadedEditorStore.getState().hydrateVariables("p1");
  
      expect(reloadedEditorStore.getState().variables).toHaveLength(1);
    expect(reloadedEditorStore.getState().variables[0]?.name).toBe("拥有钥匙");
    expect(
      reloadedEditorStore.getState().scenes[0]?.blocks[0]?.metaJson,
    ).toContain("\"conditions\"");
  });
  it("更新和删除场景后会持久化并在重载后恢复", async () => {
    const fake = createFakeProjectRepository();
    await setFakeProjectRepository(fake.repository);
    const fakeStory = createFakeStoryRepository();
    await setFakeStoryRepository(fakeStory.repository);

    const [{ useProjectStore }, { useEditorStore }, { useAutoSaveStore }] =
      await Promise.all([
        import("../../features/projects/store/useProjectStore"),
        import("../../features/editor/store/useEditorStore"),
        import("./useAutoSaveStore"),
      ]);

    useProjectStore.getState().createProject("雨夜回响", "一段校园悬疑故事。");
    const project = useProjectStore.getState().currentProject!;
    const routeId = project.routes[0]!.id;
    const firstScene = useProjectStore.getState().createSceneInRoute(routeId)!;
    const secondScene = useProjectStore.getState().createSceneInRoute(routeId)!;

    useEditorStore.getState().importScene(firstScene);
    useEditorStore.getState().importScene(secondScene);
    useEditorStore.getState().selectScene(firstScene.id);
    useEditorStore.getState().addBlock("narration");
    useEditorStore.getState().updateBlockContent(
      firstScene.id,
      useEditorStore.getState().scenes[0]!.blocks[0]!.id,
      "第一段保留正文",
    );

    useProjectStore.getState().updateScene(firstScene.id, {
      title: "第一章：回到旧校舍",
      summary: "雨声落在废弃走廊里。",
      sceneType: "branch",
      status: "completed",
      isEndingScene: true,
    });
    useEditorStore.getState().selectScene(secondScene.id);
    useProjectStore.getState().deleteScene(secondScene.id);

    expect(fake.updateProject).toHaveBeenCalled();
    expect(localStorage.getItem(EDITOR_STORAGE_KEY)).toBeNull();
    expect(useAutoSaveStore.getState().lastSavedAt).not.toBeNull();

    vi.resetModules();
    await setFakeProjectRepository(fake.repository);
    await setFakeStoryRepository(fakeStory.repository);

    const { useProjectStore: reloadedProjectStore } = await import(
      "../../features/projects/store/useProjectStore"
    );
    await reloadedProjectStore.getState().hydrateLatestProject();
    const { useEditorStore: reloadedEditorStore } = await import(
      "../../features/editor/store/useEditorStore"
    );
    await reloadedEditorStore.getState().hydrateScenes(project.id);

    expect(reloadedProjectStore.getState().currentProject?.scenes).toHaveLength(1);
    expect(reloadedProjectStore.getState().currentProject?.scenes[0]).toMatchObject({
      id: firstScene.id,
      title: "第一章：回到旧校舍",
      summary: "雨声落在废弃走廊里。",
      sceneType: "branch",
      status: "completed",
      isEndingScene: true,
    });
    expect(reloadedEditorStore.getState().scenes).toHaveLength(1);
    expect(reloadedEditorStore.getState().selectedSceneId).toBe(firstScene.id);
    expect(reloadedEditorStore.getState().scenes[0]?.blocks).toHaveLength(1);
    expect(reloadedEditorStore.getState().scenes[0]?.blocks[0]?.contentText).toBe(
      "第一段保留正文",
    );
  });

  it("鍒犻櫎鍦烘櫙鍚庝細娓呯┖ choice 鎽囧紑鐩爣鍦烘櫙", async () => {
    const [{ useProjectStore }, { useEditorStore }] = await Promise.all([
      import("../../features/projects/store/useProjectStore"),
      import("../../features/editor/store/useEditorStore"),
    ]);

    useProjectStore.getState().createProject("闆ㄥ鍥炲搷", "涓€娈垫牎鍥偓鐤戞晠浜?");
    const project = useProjectStore.getState().currentProject!;
    const routeId = project.routes[0]!.id;
    const firstScene = useProjectStore.getState().createSceneInRoute(routeId)!;
    const secondScene = useProjectStore.getState().createSceneInRoute(routeId)!;
    const thirdScene = useProjectStore.getState().createSceneInRoute(routeId)!;

    useEditorStore.getState().importScene(firstScene);
    useEditorStore.getState().importScene(secondScene);
    useEditorStore.getState().importScene(thirdScene);

    useEditorStore.getState().selectScene(firstScene.id);
    useEditorStore.getState().addBlock("choice");
    const firstChoiceBlockId = useEditorStore.getState().scenes[0]?.blocks[0]?.id ?? "";
    useEditorStore.getState().updateChoiceBlock(firstScene.id, firstChoiceBlockId, {
      label: "前往终点场景",
      targetSceneId: secondScene.id,
      effectVariableId: null,
      effectValue: 0,
    });

    useEditorStore.getState().selectScene(thirdScene.id);
    useEditorStore.getState().addBlock("choice");
    const secondChoiceBlockId = useEditorStore.getState().scenes[2]?.blocks[0]?.id ?? "";
    useEditorStore.getState().updateChoiceBlock(thirdScene.id, secondChoiceBlockId, {
      label: "前往终点场景",
      targetSceneId: secondScene.id,
      effectVariableId: null,
      effectValue: 0,
    });

    useProjectStore.getState().deleteScene(secondScene.id);

    expect(useEditorStore.getState().scenes[0]?.blocks[0]?.metaJson).toContain(
      '"targetSceneId":null',
    );
    expect(useEditorStore.getState().scenes[1]?.blocks[0]?.metaJson).toContain(
      '"targetSceneId":null',
    );
  });
});
