import { beforeEach, describe, expect, it, vi } from "vitest";

const PROJECT_STORAGE_KEY = "vn-writer-lab.project-store";
const EDITOR_STORAGE_KEY = "vn-writer-lab.editor-store";
const CHARACTER_STORAGE_KEY = "vn-writer-lab.character-store";
const LORE_STORAGE_KEY = "vn-writer-lab.lore-store";

describe("store persistence", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetModules();
  });

  it("创建项目后会持久化并在重载后恢复", async () => {
    const [{ useProjectStore }, { useAutoSaveStore }] = await Promise.all([
      import("../../features/projects/store/useProjectStore"),
      import("./useAutoSaveStore"),
    ]);

    useProjectStore.getState().createProject("雨夜回响", "一段校园悬疑故事");

    expect(localStorage.getItem(PROJECT_STORAGE_KEY)).not.toBeNull();
    expect(useAutoSaveStore.getState().lastSavedAt).not.toBeNull();

    vi.resetModules();

    const { useProjectStore: reloadedProjectStore } = await import(
      "../../features/projects/store/useProjectStore"
    );

    expect(reloadedProjectStore.getState().currentProject?.name).toBe("雨夜回响");
    expect(reloadedProjectStore.getState().currentProject?.summary).toBe(
      "一段校园悬疑故事",
    );
  });

  it("新增路线和按路线创建场景后会在重载后恢复结构", async () => {
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

    expect(localStorage.getItem(PROJECT_STORAGE_KEY)).not.toBeNull();
    expect(useAutoSaveStore.getState().lastSavedAt).not.toBeNull();

    vi.resetModules();

    const { useProjectStore: reloadedProjectStore } = await import(
      "../../features/projects/store/useProjectStore"
    );

    expect(reloadedProjectStore.getState().currentProject?.routes).toHaveLength(2);
    expect(reloadedProjectStore.getState().currentProject?.scenes).toHaveLength(2);
    expect(
      reloadedProjectStore.getState().currentProject?.scenes.map(
        (scene) => scene.routeId,
      ),
    ).toEqual([defaultRouteId, secondRouteId]);
  });

  it("创建场景和内容块后会持久化并在重载后恢复", async () => {
    const [{ useEditorStore }, { useAutoSaveStore }] = await Promise.all([
      import("../../features/editor/store/useEditorStore"),
      import("./useAutoSaveStore"),
    ]);

    useEditorStore.getState().createScene();
    useEditorStore.getState().addBlock("narration");

    expect(localStorage.getItem(EDITOR_STORAGE_KEY)).not.toBeNull();
    expect(useAutoSaveStore.getState().lastSavedAt).not.toBeNull();

    vi.resetModules();

    const { useEditorStore: reloadedEditorStore } = await import(
      "../../features/editor/store/useEditorStore"
    );

    expect(reloadedEditorStore.getState().scenes).toHaveLength(1);
    expect(reloadedEditorStore.getState().scenes[0]?.blocks).toHaveLength(1);
    expect(reloadedEditorStore.getState().selectedSceneId).toBe(
      reloadedEditorStore.getState().scenes[0]?.id,
    );
  });

  it("创建角色后会持久化并在重载后恢复", async () => {
    const [{ useProjectStore }, { useCharacterStore }, { useAutoSaveStore }] =
      await Promise.all([
        import("../../features/projects/store/useProjectStore"),
        import("../../features/characters/store/useCharacterStore"),
        import("./useAutoSaveStore"),
      ]);

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

    expect(localStorage.getItem(CHARACTER_STORAGE_KEY)).not.toBeNull();
    expect(useAutoSaveStore.getState().lastSavedAt).not.toBeNull();

    vi.resetModules();

    const { useCharacterStore: reloadedCharacterStore } = await import(
      "../../features/characters/store/useCharacterStore"
    );

    expect(reloadedCharacterStore.getState().characters).toHaveLength(1);
    expect(reloadedCharacterStore.getState().characters[0]?.name).toBe("林夏");
    expect(reloadedCharacterStore.getState().selectedCharacterId).toBe(
      reloadedCharacterStore.getState().characters[0]?.id,
    );
  });

  it("创建设定后会持久化并在重载后恢复", async () => {
    const [{ useProjectStore }, { useLoreStore }, { useAutoSaveStore }] =
      await Promise.all([
        import("../../features/projects/store/useProjectStore"),
        import("../../features/lore/store/useLoreStore"),
        import("./useAutoSaveStore"),
      ]);

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

    expect(localStorage.getItem(LORE_STORAGE_KEY)).not.toBeNull();
    expect(useAutoSaveStore.getState().lastSavedAt).not.toBeNull();

    vi.resetModules();

    const { useLoreStore: reloadedLoreStore } = await import(
      "../../features/lore/store/useLoreStore"
    );

    expect(reloadedLoreStore.getState().entries).toHaveLength(1);
    expect(reloadedLoreStore.getState().entries[0]?.name).toBe("旧校舍");
    expect(reloadedLoreStore.getState().selectedLoreId).toBe(
      reloadedLoreStore.getState().entries[0]?.id,
    );
  });
  it("新增变量并配置条件块后会在重载后恢复", async () => {
    const [{ useEditorStore }, { useAutoSaveStore }] = await Promise.all([
      import("../../features/editor/store/useEditorStore"),
      import("./useAutoSaveStore"),
    ]);

    useEditorStore.getState().createScene();
    useEditorStore.getState().createVariable("p1");

    const variableId = useEditorStore.getState().variables[0]?.id ?? "";
    const sceneId = useEditorStore.getState().scenes[0]?.id ?? "";

    useEditorStore.getState().updateVariable(variableId, {
      name: "拥有钥匙",
      variableType: "flag",
      defaultValue: 1,
    });
    useEditorStore.getState().selectScene(sceneId);
    useEditorStore.getState().addBlock("condition");

    const blockId = useEditorStore.getState().scenes[0]?.blocks[0]?.id ?? "";

    useEditorStore.getState().updateConditionBlock(sceneId, blockId, {
      conditions: [
        {
          variableId,
          operator: "isTrue",
          compareValue: 1,
        },
      ],
    });

    expect(localStorage.getItem(EDITOR_STORAGE_KEY)).not.toBeNull();
    expect(useAutoSaveStore.getState().lastSavedAt).not.toBeNull();

    vi.resetModules();

    const { useEditorStore: reloadedEditorStore } = await import(
      "../../features/editor/store/useEditorStore"
    );

    expect(reloadedEditorStore.getState().variables).toHaveLength(1);
    expect(reloadedEditorStore.getState().variables[0]?.name).toBe("拥有钥匙");
    expect(
      reloadedEditorStore.getState().scenes[0]?.blocks[0]?.metaJson,
    ).toContain("\"conditions\"");
  });
  it("更新和删除场景后会持久化并在重载后恢复", async () => {
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

    expect(localStorage.getItem(PROJECT_STORAGE_KEY)).not.toBeNull();
    expect(localStorage.getItem(EDITOR_STORAGE_KEY)).not.toBeNull();
    expect(useAutoSaveStore.getState().lastSavedAt).not.toBeNull();

    vi.resetModules();

    const [
      { useProjectStore: reloadedProjectStore },
      { useEditorStore: reloadedEditorStore },
    ] = await Promise.all([
      import("../../features/projects/store/useProjectStore"),
      import("../../features/editor/store/useEditorStore"),
    ]);

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
