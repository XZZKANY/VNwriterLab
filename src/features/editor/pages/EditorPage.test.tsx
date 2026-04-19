import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SceneBlock } from "../../../lib/domain/block";
import type { Scene } from "../../../lib/domain/scene";
import type { ProjectVariable } from "../../../lib/domain/variable";
import {
  resetReferenceRepositoryForTesting,
  setReferenceRepositoryForTesting,
} from "../../../lib/repositories/referenceRepositoryRuntime";
import {
  resetStoryRepositoryForTesting,
  setStoryRepositoryForTesting,
} from "../../../lib/repositories/storyRepositoryRuntime";
import { useAutoSaveStore } from "../../../lib/store/useAutoSaveStore";
import { useProjectStore } from "../../projects/store/useProjectStore";
import { useEditorStore } from "../store/useEditorStore";
import { EditorPage } from "./EditorPage";

function createFakeReferenceRepository(initialVariables: ProjectVariable[] = []) {
  const variables = new Map(
    initialVariables.map((variable) => [variable.id, variable]),
  );

  return {
    repository: {
      listCharacters: vi.fn(async () => []),
      saveCharacter: vi.fn(async () => undefined),
      listLoreEntries: vi.fn(async () => []),
      saveLoreEntry: vi.fn(async () => undefined),
      listVariables: vi.fn(async (projectId: string) =>
        [...variables.values()].filter((variable) => variable.projectId === projectId),
      ),
      saveVariable: vi.fn(async () => undefined),
      saveVariables: vi.fn(async () => undefined),
    },
  };
}

function createScene(overrides: Partial<Scene> = {}): Scene {
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

function createBlock(overrides: Partial<SceneBlock> = {}): SceneBlock {
  return {
    id: "block-1",
    sceneId: "scene-1",
    blockType: "narration",
    sortOrder: 0,
    characterId: null,
    contentText: "雨夜里传来脚步声。",
    metaJson: null,
    ...overrides,
  };
}

function createFakeStoryRepository(initialScenes: Scene[] = []) {
  return {
    repository: {
      listScenes: vi.fn(async (projectId: string) =>
        initialScenes.filter((scene) => scene.projectId === projectId),
      ),
      createScene: vi.fn(async () => createScene()),
      updateScene: vi.fn(async () => undefined),
      deleteScene: vi.fn(async () => undefined),
      saveBlocks: vi.fn(async () => undefined),
      listLinks: vi.fn(async () => []),
      saveLinks: vi.fn(async () => undefined),
    },
  };
}

describe("EditorPage", () => {
  beforeEach(() => {
    localStorage.clear();
    useProjectStore.getState().resetProject();
    useEditorStore.getState().resetEditor();
    useAutoSaveStore.getState().reset();
    resetReferenceRepositoryForTesting();
    resetStoryRepositoryForTesting();
    cleanup();
  });

  it("允许创建场景并追加旁白块", async () => {
    const user = userEvent.setup();

    render(<EditorPage />);

    await user.click(screen.getByRole("button", { name: "新建场景" }));
    await user.click(screen.getByRole("button", { name: "新增旁白" }));

    expect(screen.getByText("未命名场景 1")).toBeInTheDocument();
    expect(screen.getByLabelText("旁白内容")).toBeInTheDocument();
  });

  it("编辑后显示自动保存状态", async () => {
    const user = userEvent.setup();

    render(<EditorPage />);

    await user.click(screen.getByRole("button", { name: "新建场景" }));
    await user.click(screen.getByRole("button", { name: "新增旁白" }));
    await user.type(screen.getByLabelText("旁白内容"), "雨夜里传来脚步声。");

    expect(screen.getByRole("status")).toHaveTextContent("已自动保存");
  });

  it("会从 repository 恢复已保存场景并显示恢复提示", async () => {
    const project = {
      id: "p1",
      name: "雨夜回响",
      summary: "",
      projectType: "route_based" as const,
      routes: [],
      scenes: [],
    };
    const scene = createScene({
      projectId: project.id,
      title: "未命名场景 1",
      blocks: [createBlock()],
    });
    const fake = createFakeStoryRepository([scene]);
    setStoryRepositoryForTesting(fake.repository);
    useProjectStore.setState({ currentProject: project });
    useAutoSaveStore.getState().markSaved("2026-04-12T02:00:00.000Z");

    render(<EditorPage />);

    expect(await screen.findByText("未命名场景 1")).toBeInTheDocument();
    expect(screen.getByLabelText("旁白内容")).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByRole("status")).toHaveTextContent("已恢复本地草稿");
    });
  });

  it("允许在场景树中切换当前场景", async () => {
    const user = userEvent.setup();

    render(<EditorPage />);

    await user.click(screen.getByRole("button", { name: "新建场景" }));
    await user.click(screen.getByRole("button", { name: "新增旁白" }));
    await user.click(screen.getByRole("button", { name: "新建场景" }));
    await user.click(screen.getByRole("button", { name: "新增注释" }));

    await user.click(screen.getByRole("button", { name: "未命名场景 1" }));

    expect(screen.getByLabelText("旁白内容")).toBeInTheDocument();
  });

  it("允许编辑块内容", async () => {
    const user = userEvent.setup();

    render(<EditorPage />);

    await user.click(screen.getByRole("button", { name: "新建场景" }));
    await user.click(screen.getByRole("button", { name: "新增旁白" }));
    await user.type(screen.getByLabelText("旁白内容"), "雨夜里传来脚步声。");

    expect(screen.getByLabelText("旁白内容")).toHaveValue(
      "雨夜里传来脚步声。",
    );
  });

  it("允许删除块并保持剩余块顺序", async () => {
    const user = userEvent.setup();

    render(<EditorPage />);

    await user.click(screen.getByRole("button", { name: "新建场景" }));
    await user.click(screen.getByRole("button", { name: "新增旁白" }));
    await user.type(screen.getAllByLabelText("旁白内容")[0]!, "A");
    await user.click(screen.getByRole("button", { name: "新增旁白" }));
    await user.type(screen.getAllByLabelText("旁白内容")[1]!, "B");
    await user.click(screen.getByRole("button", { name: "新增旁白" }));
    await user.type(screen.getAllByLabelText("旁白内容")[2]!, "C");

    await user.click(screen.getAllByRole("button", { name: "删除" })[1]!);

    expect(
      useEditorStore
        .getState()
        .scenes[0]?.blocks.map((block) => block.contentText),
    ).toEqual(["A", "C"]);
    expect(
      useEditorStore.getState().scenes[0]?.blocks.map((block) => block.sortOrder),
    ).toEqual([0, 1]);
    expect(
      screen.getAllByLabelText("旁白内容").map((item) =>
        (item as HTMLTextAreaElement).value,
      ),
    ).toEqual(["A", "C"]);
  });

  it("允许上移和下移块并保持 sortOrder 连续", async () => {
    const user = userEvent.setup();

    render(<EditorPage />);

    await user.click(screen.getByRole("button", { name: "新建场景" }));
    await user.click(screen.getByRole("button", { name: "新增旁白" }));
    await user.type(screen.getAllByLabelText("旁白内容")[0]!, "A");
    await user.click(screen.getByRole("button", { name: "新增旁白" }));
    await user.type(screen.getAllByLabelText("旁白内容")[1]!, "B");
    await user.click(screen.getByRole("button", { name: "新增旁白" }));
    await user.type(screen.getAllByLabelText("旁白内容")[2]!, "C");

    await user.click(screen.getAllByRole("button", { name: "下移" })[0]!);

    expect(
      useEditorStore
        .getState()
        .scenes[0]?.blocks.map((block) => block.contentText),
    ).toEqual(["B", "A", "C"]);
    expect(
      useEditorStore.getState().scenes[0]?.blocks.map((block) => block.sortOrder),
    ).toEqual([0, 1, 2]);
    expect(
      screen.getAllByLabelText("旁白内容").map((item) =>
        (item as HTMLTextAreaElement).value,
      ),
    ).toEqual(["B", "A", "C"]);

    await user.click(screen.getAllByRole("button", { name: "上移" })[1]!);

    expect(
      useEditorStore
        .getState()
        .scenes[0]?.blocks.map((block) => block.contentText),
    ).toEqual(["A", "B", "C"]);
    expect(
      useEditorStore.getState().scenes[0]?.blocks.map((block) => block.sortOrder),
    ).toEqual([0, 1, 2]);
    expect(
      screen.getAllByLabelText("旁白内容").map((item) =>
        (item as HTMLTextAreaElement).value,
      ),
    ).toEqual(["A", "B", "C"]);
  });

  it("存在项目路线时允许在指定路线下新建场景", async () => {
    const user = userEvent.setup();

    useProjectStore.getState().createProject("雨夜回响", "一段校园悬疑故事");
    useProjectStore.getState().createRoute("林夏线");

    render(<EditorPage />);

    await user.click(
      screen.getAllByRole("button", { name: "在此路线新建场景" })[0]!,
    );

    expect(screen.getAllByText("共通线")[0]).toBeInTheDocument();
    expect(screen.getAllByText("林夏线")[0]).toBeInTheDocument();
    expect(screen.getByText("未命名场景 1")).toBeInTheDocument();
  });

  it("允许管理变量并编辑条件块", async () => {
    const user = userEvent.setup();

    useProjectStore.getState().createProject("雨夜回响", "一段校园悬疑故事");

    render(<EditorPage />);

    await user.click(screen.getByRole("button", { name: "新增变量" }));
    await user.clear(screen.getByLabelText("变量名称"));
    await user.type(screen.getByLabelText("变量名称"), "拥有钥匙");
    await user.selectOptions(screen.getByLabelText("变量类型"), "flag");
    await user.selectOptions(screen.getByLabelText("默认值"), "1");

    await user.click(
      screen.getByRole("button", { name: "在此路线新建场景" }),
    );
    await user.click(screen.getByRole("button", { name: "新增条件" }));

    expect(screen.getByLabelText("条件变量")).toHaveValue(
      useEditorStore.getState().variables[0]?.id,
    );

    await user.selectOptions(screen.getByLabelText("条件运算"), "isTrue");

    expect(screen.getByLabelText("条件运算")).toHaveValue("isTrue");
  });

  it("当前项目已存在且项目变量为空时会自动 hydrate 变量", async () => {
    const project = {
      id: "p1",
      name: "雨夜回响",
      summary: "",
      projectType: "route_based" as const,
      routes: [],
      scenes: [],
    };
    const fake = createFakeReferenceRepository([
      {
        id: "v1",
        projectId: project.id,
        name: "拥有钥匙",
        variableType: "flag",
        defaultValue: 1,
      },
    ]);
    setReferenceRepositoryForTesting(fake.repository);
    useProjectStore.setState({ currentProject: project });

    render(<EditorPage />);

    expect(await screen.findByRole("button", { name: "拥有钥匙" })).toBeInTheDocument();
  });

  it("当前项目已存在且编辑器场景为空时会自动 hydrate 场景正文", async () => {
    const project = {
      id: "p1",
      name: "雨夜回响",
      summary: "",
      projectType: "route_based" as const,
      routes: [],
      scenes: [],
    };
    const scene = createScene({
      projectId: project.id,
      blocks: [createBlock()],
    });
    const fake = createFakeStoryRepository([scene]);
    setStoryRepositoryForTesting(fake.repository);
    useProjectStore.setState({ currentProject: project });

    render(<EditorPage />);

    expect(await screen.findByRole("button", { name: "旧校舍入口" })).toBeInTheDocument();
    expect(screen.getByLabelText("旁白内容")).toHaveValue("雨夜里传来脚步声。");
  });

  it("允许为选项块配置变量副作用", async () => {
    const user = userEvent.setup();

    useProjectStore.getState().createProject("雨夜回响", "一段校园悬疑故事");

    render(<EditorPage />);

    await user.click(screen.getByRole("button", { name: "新增变量" }));
    await user.clear(screen.getByLabelText("变量名称"));
    await user.type(screen.getByLabelText("变量名称"), "拥有钥匙");

    await user.click(
      screen.getByRole("button", { name: "在此路线新建场景" }),
    );
    await user.click(screen.getByRole("button", { name: "新增选项" }));
    await user.type(screen.getByLabelText("选项文案"), "拿起钥匙");
    await user.selectOptions(
      screen.getByLabelText("修改变量"),
      useEditorStore.getState().variables[0]!.id,
    );
    await user.clear(screen.getByLabelText("副作用值"));
    await user.type(screen.getByLabelText("副作用值"), "1");

    expect(screen.getByLabelText("副作用值")).toHaveValue(1);
  });

  it("允许在场景树中将场景上移并下移", async () => {
    const user = userEvent.setup();

    useProjectStore.getState().createProject("雨夜回响", "一段校园悬疑故事");
    const project = useProjectStore.getState().currentProject!;
    const routeId = project.routes[0]!.id;

    const firstScene = useProjectStore.getState().createSceneInRoute(routeId)!;
    useEditorStore.getState().importScene(firstScene);
    const secondScene = useProjectStore.getState().createSceneInRoute(routeId)!;
    useEditorStore.getState().importScene(secondScene);

    render(<EditorPage />);

    await user.click(screen.getAllByRole("button", { name: "下移" })[0]!);

    expect(screen.getAllByRole("button", { name: /未命名场景/ })[0]).toHaveTextContent(
      "未命名场景 2",
    );
  });

  it("允许把场景移动到其他路线", async () => {
    const user = userEvent.setup();

    useProjectStore.getState().createProject("雨夜回响", "一段校园悬疑故事");
    useProjectStore.getState().createRoute("林夏线");
    const project = useProjectStore.getState().currentProject!;
    const commonRouteId = project.routes[0]!.id;
    const targetRouteId = project.routes[1]!.id;

    const scene = useProjectStore.getState().createSceneInRoute(commonRouteId)!;
    useEditorStore.getState().importScene(scene);

    render(<EditorPage />);

    await user.selectOptions(screen.getByLabelText("移动到路线"), targetRouteId);
    await user.click(screen.getByRole("button", { name: "移动场景" }));

    expect(screen.getAllByText("林夏线")[0]).toBeInTheDocument();
    expect(screen.getAllByText("共通线")[0]).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "未命名场景 1" })).toBeInTheDocument();
  });

  it("条件块可以显示条件列表并新增第二项", async () => {
    const user = userEvent.setup();

    useProjectStore.getState().createProject("雨夜回响", "一段校园悬疑故事");
    render(<EditorPage />);

    await user.click(screen.getByRole("button", { name: "新增变量" }));
    await user.clear(screen.getByLabelText("变量名称"));
    await user.type(screen.getByLabelText("变量名称"), "拥有钥匙");
    await user.selectOptions(screen.getByLabelText("变量类型"), "flag");
    await user.selectOptions(screen.getByLabelText("默认值"), "1");

    await user.click(screen.getByRole("button", { name: "在此路线新建场景" }));
    await user.click(screen.getByRole("button", { name: "新增条件" }));

    expect(screen.getByRole("button", { name: "添加条件项" })).toBeInTheDocument();
    expect(screen.getAllByLabelText("条件变量")).toHaveLength(1);

    await user.click(screen.getByRole("button", { name: "添加条件项" }));

    expect(screen.getAllByLabelText("条件变量")).toHaveLength(2);
    expect(screen.getAllByRole("button", { name: "删除此项" })).toHaveLength(2);
  });

  it("条件块支持切换为满足任一条件并写入元数据", async () => {
    const user = userEvent.setup();

    useProjectStore.getState().createProject("雨夜回响", "一段校园悬疑故事");
    render(<EditorPage />);

    await user.click(screen.getByRole("button", { name: "新增变量" }));
    await user.click(screen.getByRole("button", { name: "在此路线新建场景" }));
    await user.click(screen.getByRole("button", { name: "新增条件" }));
    await user.selectOptions(screen.getByLabelText("条件组合"), "any");

    const conditionBlock = useEditorStore
      .getState()
      .scenes[0]?.blocks.find((block) => block.blockType === "condition");

    expect(conditionBlock?.metaJson).toContain("\"logicMode\":\"any\"");
  });

  it("注释块支持标记伏笔并写入线索编号", async () => {
    const user = userEvent.setup();

    useProjectStore.getState().createProject("雨夜回响", "一段校园悬疑故事");
    render(<EditorPage />);

    await user.click(screen.getByRole("button", { name: "在此路线新建场景" }));
    await user.click(screen.getByRole("button", { name: "新增注释" }));
    await user.selectOptions(screen.getByLabelText("注释类型"), "foreshadow");
    await user.type(screen.getByLabelText("线索编号"), "old-school-key");

    const noteBlock = useEditorStore
      .getState()
      .scenes[0]?.blocks.find((block) => block.blockType === "note");

    expect(noteBlock?.metaJson).toContain("\"noteType\":\"foreshadow\"");
    expect(noteBlock?.metaJson).toContain("\"threadId\":\"old-school-key\"");
  });

  it("允许编辑场景基础信息并同步到 project 和 editor", async () => {
    const user = userEvent.setup();

    useProjectStore.getState().createProject("雨夜回响", "一段校园悬疑故事。");
    const project = useProjectStore.getState().currentProject!;
    const routeId = project.routes[0]!.id;
    const scene = useProjectStore.getState().createSceneInRoute(routeId)!;
    useEditorStore.getState().importScene(scene);
    useEditorStore.getState().selectScene(scene.id);
    useEditorStore.getState().addBlock("narration");
    useEditorStore.getState().updateBlockContent(
      scene.id,
      useEditorStore.getState().scenes[0]!.blocks[0]!.id,
      "雨夜里传来脚步声。",
    );

    render(<EditorPage />);

    await user.clear(screen.getByLabelText("场景标题"));
    await user.type(screen.getByLabelText("场景标题"), "第一章：回到旧校舍");
    await user.clear(screen.getByLabelText("场景摘要"));
    await user.type(screen.getByLabelText("场景摘要"), "雨声落在废弃走廊里。");
    await user.selectOptions(screen.getByLabelText("场景类型"), "branch");
    await user.selectOptions(screen.getByLabelText("场景状态"), "completed");
    await user.click(screen.getByLabelText("是否起始场景"));
    await user.click(screen.getByLabelText("是否结局场景"));

    expect(screen.getByLabelText("场景标题")).toHaveValue("第一章：回到旧校舍");
    expect(screen.getByLabelText("场景摘要")).toHaveValue("雨声落在废弃走廊里。");
    expect(screen.getByLabelText("场景类型")).toHaveValue("branch");
    expect(screen.getByLabelText("场景状态")).toHaveValue("completed");
    expect(screen.getByLabelText("是否起始场景")).not.toBeChecked();
    expect(screen.getByLabelText("是否结局场景")).toBeChecked();

    expect(useProjectStore.getState().currentProject?.scenes[0]).toMatchObject({
      id: scene.id,
      title: "第一章：回到旧校舍",
      summary: "雨声落在废弃走廊里。",
      sceneType: "branch",
      status: "completed",
      isStartScene: false,
      isEndingScene: true,
    });
    expect(useEditorStore.getState().scenes[0]).toMatchObject({
      id: scene.id,
      title: "第一章：回到旧校舍",
      summary: "雨声落在废弃走廊里。",
      sceneType: "branch",
      status: "completed",
      isStartScene: false,
      isEndingScene: true,
    });
    expect(useEditorStore.getState().scenes[0]?.blocks).toHaveLength(1);
    expect(useEditorStore.getState().scenes[0]?.blocks[0]?.contentText).toBe(
      "雨夜里传来脚步声。",
    );
  });

  it("场景状态下拉会提供完整的五种状态", async () => {
    const user = userEvent.setup();

    useProjectStore.getState().createProject("雨夜回响", "一段校园悬疑故事。");
    const project = useProjectStore.getState().currentProject!;
    const routeId = project.routes[0]!.id;
    const scene = useProjectStore.getState().createSceneInRoute(routeId)!;
    useEditorStore.getState().importScene(scene);
    useEditorStore.getState().selectScene(scene.id);

    render(<EditorPage />);

    expect(screen.getByRole("option", { name: "草稿" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "已完成" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "需修改" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "待补充" })).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: "待检查逻辑" }),
    ).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText("场景状态"), "needs_supplement");
    expect(screen.getByLabelText("场景状态")).toHaveValue("needs_supplement");
  });

  it("删除当前选中场景时会切换到下一个可用场景并清理 links", async () => {
    const user = userEvent.setup();

    useProjectStore.getState().createProject("雨夜回响", "一段校园悬疑故事。");
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
    const choiceBlockId = useEditorStore.getState().scenes[0]?.blocks[0]?.id;
    if (choiceBlockId) {
      useEditorStore.getState().updateChoiceBlock(firstScene.id, choiceBlockId, {
        label: "前往中间场景",
        targetSceneId: secondScene.id,
        effectVariableId: null,
        effectValue: 0,
      });
    }

    render(<EditorPage />);

    await user.click(screen.getByRole("button", { name: secondScene.title }));
    await user.click(screen.getAllByRole("button", { name: "删除场景" })[1]!);

    expect(useEditorStore.getState().selectedSceneId).toBe(thirdScene.id);
    expect(useProjectStore.getState().currentProject?.scenes.map((scene) => scene.id)).toEqual([
      firstScene.id,
      thirdScene.id,
    ]);
    expect(useProjectStore.getState().currentProject?.scenes.map((scene) => scene.sortOrder)).toEqual([
      0,
      1,
    ]);
    expect(useProjectStore.getState().currentProject?.scenes.map((scene) => scene.isStartScene)).toEqual([
      true,
      false,
    ]);
    expect(useEditorStore.getState().links).toHaveLength(0);
    expect(screen.getByLabelText("场景标题")).toHaveValue(thirdScene.title);
  });

  it("删除变量时能清理引用并让选中变量回退到下一个", async () => {
    const user = userEvent.setup();

    useProjectStore.getState().createProject("雨夜回响", "一段校园悬疑故事");

    render(<EditorPage />);

    await user.click(screen.getByRole("button", { name: "新增变量" }));
    await user.click(screen.getByRole("button", { name: "新增变量" }));

    const [firstVariable, secondVariable] = useEditorStore.getState().variables;
    expect(firstVariable).toBeDefined();
    expect(secondVariable).toBeDefined();

    await user.click(screen.getByRole("button", { name: "变量 1" }));
    await user.clear(screen.getByLabelText("变量名称"));
    await user.type(screen.getByLabelText("变量名称"), "拥有钥匙");

    await user.click(screen.getByRole("button", { name: "变量 2" }));
    await user.clear(screen.getByLabelText("变量名称"));
    await user.type(screen.getByLabelText("变量名称"), "表示值");

    await user.click(screen.getByRole("button", { name: "在此路线新建场景" }));
    await user.click(screen.getByRole("button", { name: "新增条件" }));
    await user.click(screen.getByRole("button", { name: "新增选项" }));

    await user.selectOptions(screen.getByLabelText("条件变量"), firstVariable.id);
    await user.selectOptions(screen.getByLabelText("修改变量"), firstVariable.id);

    useEditorStore.getState().selectVariable(firstVariable.id);
    await user.click(screen.getByRole("button", { name: "删除变量" }));

    expect(useEditorStore.getState().variables.map((variable) => variable.id)).toEqual([
      secondVariable.id,
    ]);
    expect(useEditorStore.getState().selectedVariableId).toBe(secondVariable.id);
    expect(
      useEditorStore.getState().scenes[0]?.blocks[0]?.metaJson,
    ).toContain('"conditions":[{"variableId":null');
    expect(
      useEditorStore.getState().scenes[0]?.blocks[1]?.metaJson,
    ).toContain('"effectVariableId":null');
    expect(screen.getByLabelText("变量名称")).toHaveValue("表示值");
  });

  it("删除场景时能清空所有入口左右关联的 targetSceneId", async () => {
    const user = userEvent.setup();

    useProjectStore.getState().createProject("雨夜回响", "一段校园悬疑故事");
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
    const firstChoiceBlockId = useEditorStore.getState().scenes[0]?.blocks[0]?.id;
    if (firstChoiceBlockId) {
      useEditorStore.getState().updateChoiceBlock(firstScene.id, firstChoiceBlockId, {
        label: "前往终点场景",
        targetSceneId: secondScene.id,
        effectVariableId: null,
        effectValue: 0,
      });
    }

    useEditorStore.getState().selectScene(thirdScene.id);
    useEditorStore.getState().addBlock("choice");
    const secondChoiceBlockId = useEditorStore.getState().scenes[2]?.blocks[0]?.id;
    if (secondChoiceBlockId) {
      useEditorStore.getState().updateChoiceBlock(thirdScene.id, secondChoiceBlockId, {
        label: "前往终点场景",
        targetSceneId: secondScene.id,
        effectVariableId: null,
        effectValue: 0,
      });
    }

    render(<EditorPage />);

    await user.click(screen.getByRole("button", { name: secondScene.title }));
    await user.click(screen.getAllByRole("button", { name: "删除场景" })[1]!);

    expect(useProjectStore.getState().currentProject?.scenes.map((scene) => scene.id)).toEqual([
      firstScene.id,
      thirdScene.id,
    ]);
    expect(
      useEditorStore.getState().scenes[0]?.blocks[0]?.metaJson,
    ).toContain('"targetSceneId":null');
    expect(
      useEditorStore.getState().scenes[1]?.blocks[0]?.metaJson,
    ).toContain('"targetSceneId":null');
  });
});
