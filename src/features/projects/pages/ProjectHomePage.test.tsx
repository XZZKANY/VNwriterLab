import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Project } from "../../../lib/domain/project";
import type { Scene } from "../../../lib/domain/scene";
import { useAutoSaveStore } from "../../../lib/store/useAutoSaveStore";
import { resetProjectRepositoryForTesting } from "../../../lib/repositories/projectRepositoryRuntime";
import { useCharacterStore } from "../../characters/store/useCharacterStore";
import { useEditorStore } from "../../editor/store/useEditorStore";
import { useLoreStore } from "../../lore/store/useLoreStore";
import { useProjectStore } from "../store/useProjectStore";
import { ProjectHomePage } from "./ProjectHomePage";

const { navigateMock } = vi.hoisted(() => ({
  navigateMock: vi.fn(),
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>(
    "react-router-dom",
  );

  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

function createScene(overrides: Partial<Scene> = {}): Scene {
  return {
    id: "scene-1",
    projectId: "project-1",
    routeId: "route-1",
    title: "旧校舍入口",
    summary: "雨夜回响的开场片段。",
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

function createProject(scenes: Scene[]): Project {
  return {
    id: "project-1",
    name: "雨夜回响",
    summary: "测试用项目",
    projectType: "route_based",
    routes: [
      {
        id: "route-1",
        projectId: "project-1",
        name: "主线",
        routeType: "common",
        description: "主线",
        sortOrder: 0,
      },
    ],
    scenes,
  };
}

describe("ProjectHomePage", () => {
  beforeEach(() => {
    localStorage.clear();
    navigateMock.mockReset();
    resetProjectRepositoryForTesting();
    useProjectStore.getState().resetProject();
    useEditorStore.getState().resetEditor();
    useCharacterStore.getState().resetCharacters();
    useLoreStore.getState().resetLoreEntries();
    useAutoSaveStore.getState().reset();
    cleanup();
  });

  it("会展示最近编辑并提供继续写作、打开分支图、从头预览入口", async () => {
    const user = userEvent.setup();
    const startScene = createScene({
      id: "scene-1",
      title: "序章",
      summary: "故事从这里开始。",
      sortOrder: 0,
      isStartScene: true,
    });
    const recentScene = createScene({
      id: "scene-2",
      title: "旧校舍入口",
      summary: "最近修改的场景摘要。",
      sortOrder: 1,
      status: "needs_revision",
      isStartScene: false,
    });

    useProjectStore.setState({
      currentProject: createProject([startScene, recentScene]),
    });
    useEditorStore.setState({
      scenes: [startScene, recentScene],
      selectedSceneId: recentScene.id,
      links: [],
      variables: [],
      selectedVariableId: null,
    });

    render(<ProjectHomePage />);

    const recentRegion = screen.getByRole("region", { name: "最近编辑" });
    expect(within(recentRegion).getByText("旧校舍入口")).toBeInTheDocument();
    expect(within(recentRegion).getByText("所属路线：主线")).toBeInTheDocument();
    expect(within(recentRegion).getByText("当前状态：需修改")).toBeInTheDocument();
    expect(within(recentRegion).getByText("最近修改的场景摘要。")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "继续写作" }));
    expect(useEditorStore.getState().selectedSceneId).toBe(recentScene.id);
    expect(navigateMock).toHaveBeenLastCalledWith("/editor");

    await user.click(screen.getByRole("button", { name: "打开分支图" }));
    expect(useEditorStore.getState().selectedSceneId).toBe(recentScene.id);
    expect(navigateMock).toHaveBeenLastCalledWith("/graph");

    await user.click(screen.getByRole("button", { name: "从头预览" }));
    expect(useEditorStore.getState().selectedSceneId).toBe(startScene.id);
    expect(navigateMock).toHaveBeenLastCalledWith("/preview");
  });

  it("没有可继续创作的场景时会展示空态", () => {
    useProjectStore.setState({
      currentProject: createProject([]),
    });
    useEditorStore.setState({
      scenes: [],
      selectedSceneId: null,
      links: [],
      variables: [],
      selectedVariableId: null,
    });

    render(<ProjectHomePage />);

    const recentRegion = screen.getByRole("region", { name: "最近编辑" });
    expect(within(recentRegion).getByText("暂无可继续创作的场景。")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "继续写作" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "打开分支图" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "从头预览" })).not.toBeInTheDocument();
  });

  it("项目创建表单只暴露三种模板", () => {
    render(<ProjectHomePage />);

    expect(within(screen.getByLabelText("项目模板")).getAllByRole("option")).toHaveLength(
      3,
    );
  });

  it("允许创建线性短篇并初始化单路线单场景结构", async () => {
    const user = userEvent.setup();

    render(<ProjectHomePage />);

    await user.type(screen.getByLabelText("项目名称"), "雨夜回响");
    await user.type(screen.getByLabelText("一句话简介"), "一段校园悬疑故事");
    await user.selectOptions(screen.getByLabelText("项目模板"), "linear_short");
    await user.click(screen.getByRole("button", { name: "创建项目" }));

    expect(screen.getByText("主线")).toBeInTheDocument();
    expect(screen.getByText("场景数：1")).toBeInTheDocument();
    expect(screen.getByText("开场")).toBeInTheDocument();
    expect(useEditorStore.getState().scenes.map((scene) => scene.title)).toEqual([
      "开场",
    ]);
  });

  it("允许创建多结局模板并初始化结局结构", async () => {
    const user = userEvent.setup();

    render(<ProjectHomePage />);

    await user.type(screen.getByLabelText("项目名称"), "雨夜回响");
    await user.type(screen.getByLabelText("一句话简介"), "一段校园悬疑故事");
    await user.selectOptions(screen.getByLabelText("项目模板"), "multi_ending");
    await user.click(screen.getByRole("button", { name: "创建项目" }));

    expect(screen.getByText("主线")).toBeInTheDocument();
    expect(screen.getByText("场景数：3")).toBeInTheDocument();
    expect(screen.getByText("结局场景数：2")).toBeInTheDocument();
    expect(useEditorStore.getState().scenes.map((scene) => scene.title)).toEqual([
      "开场",
      "普通结局",
      "真结局",
    ]);
  });

  it("允许创建共通线 + 角色线模板并初始化结构", async () => {
    const user = userEvent.setup();

    render(<ProjectHomePage />);

    await user.type(screen.getByLabelText("项目名称"), "雨夜回响");
    await user.type(screen.getByLabelText("一句话简介"), "一段校园悬疑故事");
    await user.selectOptions(screen.getByLabelText("项目模板"), "route_character");
    await user.click(screen.getByRole("button", { name: "创建项目" }));

    expect(screen.getByText("共通线")).toBeInTheDocument();
    expect(screen.getByText("角色线 1")).toBeInTheDocument();
    expect(screen.getByText("角色线 2")).toBeInTheDocument();
    expect(screen.getByText("场景总数：3")).toBeInTheDocument();
    expect(useEditorStore.getState().scenes.map((scene) => scene.title)).toEqual([
      "共通线开场",
      "角色线 1 开场",
      "角色线 2 开场",
    ]);
  });

  it("支持生成三种导出内容", async () => {
    const user = userEvent.setup();
    const scene = createScene({
      id: "scene-1",
      title: "序章",
      summary: "雨夜开场",
      blocks: [
        {
          id: "block-1",
          sceneId: "scene-1",
          blockType: "narration",
          sortOrder: 0,
          characterId: null,
          contentText: "雨夜里传来脚步声。",
          metaJson: null,
        },
      ],
    });

    useProjectStore.setState({
      currentProject: createProject([scene]),
    });
    useEditorStore.setState({
      scenes: [scene],
      selectedSceneId: scene.id,
      links: [],
      variables: [],
      selectedVariableId: null,
    });

    render(<ProjectHomePage />);

    await user.click(screen.getByRole("button", { name: "生成结构化 JSON" }));
    expect(
      (screen.getByLabelText("导出结果") as HTMLTextAreaElement).value,
    ).toContain("\"name\": \"雨夜回响\"");

    await user.click(screen.getByRole("button", { name: "生成纯文本稿" }));
    expect(
      (screen.getByLabelText("导出结果") as HTMLTextAreaElement).value,
    ).toContain("## 路线：主线");

    await user.click(screen.getByRole("button", { name: "生成引擎草稿脚本" }));
    expect(
      (screen.getByLabelText("导出结果") as HTMLTextAreaElement).value,
    ).toContain("label scene-1:");
  });
});
