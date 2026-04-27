import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useEditorStore } from "@/features/editor/store/useEditorStore";
import { useProjectStore } from "@/features/projects/store/useProjectStore";
import { ViewsPage } from "./ViewsPage";

const { navigateMock } = vi.hoisted(() => ({
  navigateMock: vi.fn(),
}));

vi.mock("react-router-dom", async () => {
  const actual =
    await vi.importActual<typeof import("react-router-dom")>(
      "react-router-dom",
    );

  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

describe("ViewsPage", () => {
  beforeEach(() => {
    navigateMock.mockReset();
    useProjectStore.getState().resetProject();
    useEditorStore.getState().resetEditor();
  });

  it("会显示大纲视图并支持返回编辑", async () => {
    const user = userEvent.setup();
    useProjectStore.setState({
      currentProject: {
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
      },
    });
    useEditorStore.setState({
      scenes: [
        {
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
        },
      ],
      selectedSceneId: null,
      links: [],
      variables: [],
      selectedVariableId: null,
    });

    render(<ViewsPage />);

    expect(screen.getByText("大纲视图")).toBeInTheDocument();
    expect(screen.getByText("主线")).toBeInTheDocument();
    expect(screen.getByText("序章")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "返回编辑：序章" }));

    expect(useEditorStore.getState().selectedSceneId).toBe("s1");
    expect(navigateMock).toHaveBeenCalledWith("/editor");
  });
});
