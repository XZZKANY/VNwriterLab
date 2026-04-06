import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { useCharacterStore } from "../../characters/store/useCharacterStore";
import { useEditorStore } from "../../editor/store/useEditorStore";
import { useLoreStore } from "../../lore/store/useLoreStore";
import { useAutoSaveStore } from "../../../lib/store/useAutoSaveStore";
import { useProjectStore } from "../store/useProjectStore";
import { ProjectHomePage } from "./ProjectHomePage";

function EditorSelectionProbe() {
  const selectedSceneId = useEditorStore((state) => state.selectedSceneId);

  return <div>编辑器场景：{selectedSceneId ?? "未选择"}</div>;
}

function PreviewProbe() {
  return <div>预览页</div>;
}

function GraphProbe() {
  return <div>分支图页</div>;
}

describe("ProjectHomePage", () => {
  beforeEach(() => {
    localStorage.clear();
    useProjectStore.getState().resetProject();
    useEditorStore.getState().resetEditor();
    useCharacterStore.getState().resetCharacters();
    useLoreStore.getState().resetLoreEntries();
    useAutoSaveStore.getState().reset();
    cleanup();
  });

  function renderProjectHomePageWithRoutes(
    homeElement: React.ReactElement = <ProjectHomePage />,
  ) {
    return render(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route path="/" element={homeElement} />
          <Route path="/editor" element={<EditorSelectionProbe />} />
          <Route path="/preview" element={<PreviewProbe />} />
          <Route path="/graph" element={<GraphProbe />} />
        </Routes>
      </MemoryRouter>,
    );
  }

  it("允许创建新项目并显示项目简介", async () => {
    const user = userEvent.setup();

    renderProjectHomePageWithRoutes();

    await user.type(screen.getByLabelText("项目名称"), "雨夜回响");
    await user.type(screen.getByLabelText("一句话简介"), "一段校园悬疑故事");
    await user.click(screen.getByRole("button", { name: "创建项目" }));

    expect(screen.getByText("雨夜回响")).toBeInTheDocument();
    expect(screen.getByText("一段校园悬疑故事")).toBeInTheDocument();
  });

  it("允许创建项目时选择模板并初始化对应结构", async () => {
    const user = userEvent.setup();

    renderProjectHomePageWithRoutes();

    await user.type(screen.getByLabelText("项目名称"), "雨夜回响");
    await user.type(screen.getByLabelText("一句话简介"), "一段校园悬疑故事");
    await user.selectOptions(screen.getByLabelText("项目模板"), "multi_ending");
    await user.click(screen.getByRole("button", { name: "创建项目" }));

    expect(screen.getByText("主线")).toBeInTheDocument();
    expect(screen.getByText("场景数：3")).toBeInTheDocument();
    expect(screen.getByText("场景总数：3")).toBeInTheDocument();
    expect(screen.getByText("结局场景数：2")).toBeInTheDocument();
    expect(screen.getByText("开场")).toBeInTheDocument();
  });

  it("创建项目后显示自动保存状态", async () => {
    const user = userEvent.setup();

    renderProjectHomePageWithRoutes();

    await user.type(screen.getByLabelText("项目名称"), "雨夜回响");
    await user.type(screen.getByLabelText("一句话简介"), "一段校园悬疑故事");
    await user.click(screen.getByRole("button", { name: "创建项目" }));

    expect(screen.getByRole("status")).toHaveTextContent("已自动保存");
  });

  it("创建项目后显示默认共通线并支持新增路线", async () => {
    const user = userEvent.setup();

    renderProjectHomePageWithRoutes();

    await user.type(screen.getByLabelText("项目名称"), "雨夜回响");
    await user.type(screen.getByLabelText("一句话简介"), "一段校园悬疑故事");
    await user.click(screen.getByRole("button", { name: "创建项目" }));

    expect(screen.getByText("共通线")).toBeInTheDocument();
    expect(screen.getByText("场景数：0")).toBeInTheDocument();

    await user.type(screen.getByLabelText("新路线名称"), "林夏线");
    await user.click(screen.getByRole("button", { name: "新增路线" }));

    expect(screen.getByText("林夏线")).toBeInTheDocument();
  });

  it("重载后会恢复已保存项目并显示恢复提示", async () => {
    const { useProjectStore } = await import("../store/useProjectStore");

    useProjectStore.getState().createProject("雨夜回响", "一段校园悬疑故事");

    vi.resetModules();

    const { ProjectHomePage: ReloadedProjectHomePage } = await import("./ProjectHomePage");

    renderProjectHomePageWithRoutes(<ReloadedProjectHomePage />);

    expect(screen.getByText("雨夜回响")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("已恢复本地草稿");
  });

  it("创建项目后按路线展示场景数量", async () => {
    useProjectStore.getState().createProject("雨夜回响", "一段校园悬疑故事");

    const defaultRouteId =
      useProjectStore.getState().currentProject?.routes[0]?.id ?? "";

    useProjectStore.getState().createRoute("林夏线");
    useProjectStore.getState().createSceneInRoute(defaultRouteId);

    const secondRouteId =
      useProjectStore.getState().currentProject?.routes[1]?.id ?? "";

    useProjectStore.getState().createSceneInRoute(secondRouteId);

    renderProjectHomePageWithRoutes();

    expect(screen.getByText("共通线")).toBeInTheDocument();
    expect(screen.getByText("林夏线")).toBeInTheDocument();
    expect(screen.getAllByText("场景数：1")).toHaveLength(2);
  });

  it("允许在项目页直接重命名路线", async () => {
    const user = userEvent.setup();

    useProjectStore.getState().createProject("雨夜回响", "一段校园悬疑故事");

    renderProjectHomePageWithRoutes();

    await user.clear(screen.getByLabelText("路线名称"));
    await user.type(screen.getByLabelText("路线名称"), "主线");
    await user.click(screen.getByRole("button", { name: "保存路线名称" }));

    expect(screen.getByText("主线")).toBeInTheDocument();
  });

  it("会展示项目统计信息", () => {
    useProjectStore.getState().createProject("雨夜回响", "一段校园悬疑故事");
    const currentProject = useProjectStore.getState().currentProject!;
    const routeId = currentProject.routes[0]!.id;

    useProjectStore.getState().createSceneInRoute(routeId);
    useProjectStore.setState({
      currentProject: {
        ...useProjectStore.getState().currentProject!,
        scenes: useProjectStore.getState().currentProject!.scenes.map((scene, index) =>
          index === 0 ? { ...scene, isEndingScene: true, sceneType: "ending" } : scene,
        ),
      },
    });
    useEditorStore.setState({
      scenes: useProjectStore.getState().currentProject!.scenes,
      links: [],
      variables: [
        {
          id: "v1",
          projectId: currentProject.id,
          name: "勇气",
          variableType: "number",
          defaultValue: 0,
        },
      ],
      selectedSceneId: null,
      selectedVariableId: null,
    });
    useCharacterStore.setState({
      characters: [
        {
          id: "c1",
          projectId: currentProject.id,
          name: "林夏",
          identity: "",
          appearance: "",
          personality: "",
          goal: "",
          secret: "",
          routeId: null,
          notes: "",
        },
      ],
      selectedCharacterId: "c1",
    });
    useLoreStore.setState({
      entries: [
        {
          id: "l1",
          projectId: currentProject.id,
          name: "旧校舍",
          category: "location",
          description: "",
          tags: [],
        },
      ],
      selectedLoreId: "l1",
    });

    renderProjectHomePageWithRoutes();

    expect(screen.getByRole("heading", { name: "项目统计" })).toBeInTheDocument();
    expect(screen.getByText("路线数：1")).toBeInTheDocument();
    expect(screen.getByText("场景总数：1")).toBeInTheDocument();
    expect(screen.getByText("结局场景数：1")).toBeInTheDocument();
    expect(screen.getByText("变量数：1")).toBeInTheDocument();
    expect(screen.getByText("角色数：1")).toBeInTheDocument();
    expect(screen.getByText("设定数：1")).toBeInTheDocument();
    expect(screen.getByText("问题场景数：1")).toBeInTheDocument();
  });

  it("允许在项目首页执行全局搜索并按类别展示结果", async () => {
    const user = userEvent.setup();

    useProjectStore.getState().createProject("雨夜回响", "一段校园悬疑故事");
    const currentProject = useProjectStore.getState().currentProject!;
    const routeId = currentProject.routes[0]!.id;

    useProjectStore.setState({
      currentProject: {
        ...currentProject,
        scenes: [
          {
            id: "s1",
            projectId: currentProject.id,
            routeId,
            title: "旧校舍入口",
            summary: "今夜再次听见脚步声。",
            sceneType: "normal",
            status: "draft",
            chapterLabel: "",
            sortOrder: 0,
            isStartScene: true,
            isEndingScene: false,
            notes: "",
            blocks: [],
          },
        ],
      },
    });
    useEditorStore.setState({
      scenes: [
        {
          id: "s1",
          projectId: currentProject.id,
          routeId,
          title: "旧校舍入口",
          summary: "今夜再次听见脚步声。",
          sceneType: "normal",
          status: "draft",
          chapterLabel: "",
          sortOrder: 0,
          isStartScene: true,
          isEndingScene: false,
          notes: "",
          blocks: [
            {
              id: "b1",
              sceneId: "s1",
              blockType: "narration",
              sortOrder: 0,
              characterId: null,
              contentText: "林夏站在旧校舍门外。",
              metaJson: null,
            },
          ],
        },
      ],
      links: [],
      variables: [],
      selectedSceneId: null,
      selectedVariableId: null,
    });
    useCharacterStore.setState({
      characters: [
        {
          id: "c1",
          projectId: currentProject.id,
          name: "林夏",
          identity: "旧校舍守门人",
          appearance: "",
          personality: "",
          goal: "",
          secret: "",
          routeId: null,
          notes: "",
        },
      ],
      selectedCharacterId: "c1",
    });
    useLoreStore.setState({
      entries: [
        {
          id: "l1",
          projectId: currentProject.id,
          name: "旧校舍",
          category: "location",
          description: "传闻不断的旧建筑。",
          tags: ["校园"],
        },
      ],
      selectedLoreId: "l1",
    });

    renderProjectHomePageWithRoutes();

    await user.type(screen.getByLabelText("搜索关键词"), "旧校舍");

    expect(screen.getByRole("heading", { name: "搜索结果" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "场景" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "角色" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "设定" })).toBeInTheDocument();
    expect(
      within(screen.getByLabelText("场景搜索结果")).getByText("旧校舍入口"),
    ).toBeInTheDocument();
    expect(screen.getByText("林夏")).toBeInTheDocument();
    expect(screen.getAllByText("旧校舍")[0]).toBeInTheDocument();
  });

  it("全局搜索未命中时会显示空态", async () => {
    const user = userEvent.setup();

    useProjectStore.getState().createProject("雨夜回响", "一段校园悬疑故事");

    renderProjectHomePageWithRoutes();

    await user.type(screen.getByLabelText("搜索关键词"), "不存在的关键词");

    expect(screen.getByText("未找到匹配内容。")).toBeInTheDocument();
  });

  it("会展示最近编辑场景并提供继续创作入口", async () => {
    const user = userEvent.setup();

    useProjectStore.getState().createProject("雨夜回响", "一段校园悬疑故事");
    const currentProject = useProjectStore.getState().currentProject!;
    const routeId = currentProject.routes[0]!.id;
    const scene = {
      id: "s1",
      projectId: currentProject.id,
      routeId,
      title: "旧校舍入口",
      summary: "林夏决定独自进入旧校舍。",
      sceneType: "normal" as const,
      status: "needs_revision" as const,
      chapterLabel: "",
      sortOrder: 0,
      isStartScene: true,
      isEndingScene: false,
      notes: "",
      blocks: [
        {
          id: "b1",
          sceneId: "s1",
          blockType: "narration" as const,
          sortOrder: 0,
          characterId: null,
          contentText: "夜色压住了操场。",
          metaJson: null,
        },
      ],
    };

    useProjectStore.setState({
      currentProject: {
        ...currentProject,
        scenes: [scene],
      },
    });
    useEditorStore.setState({
      scenes: [scene],
      links: [],
      variables: [],
      selectedSceneId: "s1",
      selectedVariableId: null,
    });

    renderProjectHomePageWithRoutes();

    expect(screen.getByRole("heading", { name: "最近编辑" })).toBeInTheDocument();
    expect(screen.getByText("旧校舍入口")).toBeInTheDocument();
    expect(screen.getByText("所属路线：共通线")).toBeInTheDocument();
    expect(screen.getByText("当前状态：需修改")).toBeInTheDocument();
    expect(screen.getByText("林夏决定独自进入旧校舍。")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "继续写作" }));
    expect(screen.getByText("编辑器场景：s1")).toBeInTheDocument();

    renderProjectHomePageWithRoutes();
    await user.click(screen.getByRole("button", { name: "打开分支图" }));
    expect(screen.getByText("分支图页")).toBeInTheDocument();

    renderProjectHomePageWithRoutes();
    await user.click(screen.getByRole("button", { name: "从头预览" }));
    expect(screen.getByText("预览页")).toBeInTheDocument();
  });

  it("没有当前选中场景时会降级到首个可用场景", async () => {
    const user = userEvent.setup();

    useProjectStore.getState().createProject("雨夜回响", "一段校园悬疑故事");
    const currentProject = useProjectStore.getState().currentProject!;
    const routeId = currentProject.routes[0]!.id;
    const laterScene = {
      id: "s2",
      projectId: currentProject.id,
      routeId,
      title: "后段场景",
      summary: "",
      sceneType: "branch" as const,
      status: "draft" as const,
      chapterLabel: "",
      sortOrder: 2,
      isStartScene: false,
      isEndingScene: false,
      notes: "",
      blocks: [],
    };
    const firstScene = {
      id: "s1",
      projectId: currentProject.id,
      routeId,
      title: "最先可用场景",
      summary: "作为降级入口。",
      sceneType: "normal" as const,
      status: "completed" as const,
      chapterLabel: "",
      sortOrder: 0,
      isStartScene: true,
      isEndingScene: false,
      notes: "",
      blocks: [],
    };

    useProjectStore.setState({
      currentProject: {
        ...currentProject,
        scenes: [laterScene, firstScene],
      },
    });
    useEditorStore.setState({
      scenes: [laterScene, firstScene],
      links: [],
      variables: [],
      selectedSceneId: null,
      selectedVariableId: null,
    });

    renderProjectHomePageWithRoutes();

    expect(screen.getByText("最先可用场景")).toBeInTheDocument();
    expect(screen.getByText("当前状态：已完成")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "继续写作" }));
    expect(screen.getByText("编辑器场景：s1")).toBeInTheDocument();
  });
});
