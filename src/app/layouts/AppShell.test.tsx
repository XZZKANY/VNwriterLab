import { MemoryRouter } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { AppShell } from "./AppShell";
import { useEditorStore } from "@/features/editor/store/useEditorStore";
import { useProjectStore } from "@/features/projects/store/useProjectStore";

const editorInitialState = useEditorStore.getState();
const projectInitialState = useProjectStore.getState();

describe("AppShell", () => {
  beforeEach(() => {
    useEditorStore.setState(editorInitialState, true);
    useProjectStore.setState(projectInitialState, true);
  });

  afterEach(() => {
    useEditorStore.setState(editorInitialState, true);
    useProjectStore.setState(projectInitialState, true);
  });

  it("显示基础导航", () => {
    render(
      <MemoryRouter>
        <AppShell />
      </MemoryRouter>,
    );

    expect(screen.getByRole("link", { name: "项目首页" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "剧情编辑" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "分支图" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "角色" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "设定" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "预览" })).toBeInTheDocument();
  });

  it("按工作台、创作、资料、输出分组展示导航，并显示顶栏上下文", () => {
    useProjectStore.setState({
      currentProject: {
        id: "p1",
        name: "雨夜回响",
        summary: "",
        projectType: "route_based",
        routes: [],
        scenes: [],
      },
    });
    useEditorStore.setState({
      scenes: [
        {
          id: "scene-1",
          projectId: "p1",
          routeId: "route-1",
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
        },
      ],
      selectedSceneId: "scene-1",
      links: [],
      variables: [],
      selectedVariableId: null,
    });

    render(
      <MemoryRouter initialEntries={["/"]}>
        <AppShell />
      </MemoryRouter>,
    );

    expect(screen.getByText("工作台")).toBeInTheDocument();
    expect(screen.getByText("创作")).toBeInTheDocument();
    expect(screen.getByText("资料")).toBeInTheDocument();
    expect(screen.getByText("输出")).toBeInTheDocument();
    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(screen.getByText("当前项目：雨夜回响")).toBeInTheDocument();
    expect(screen.getByText("最近场景：序章")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "继续写作" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("textbox", { name: "全局搜索入口" }),
    ).toBeInTheDocument();
  });
});
