import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, vi } from "vitest";
import { useAutoSaveStore } from "../../../lib/store/useAutoSaveStore";
import type { Scene } from "../../../lib/domain/scene";
import { useProjectStore } from "../../projects/store/useProjectStore";
import { useLoreStore } from "../store/useLoreStore";
import { LorePage } from "./LorePage";

function createScene(input: {
  id: string;
  projectId: string;
  routeId: string;
  title: string;
  summary: string;
  blocks: Scene["blocks"];
}): Scene {
  return {
    id: input.id,
    projectId: input.projectId,
    routeId: input.routeId,
    title: input.title,
    summary: input.summary,
    sceneType: "normal",
    status: "draft",
    chapterLabel: "",
    sortOrder: 0,
    isStartScene: true,
    isEndingScene: false,
    notes: "",
    blocks: input.blocks,
  };
}

describe("LorePage", () => {
  beforeEach(() => {
    localStorage.clear();
    useProjectStore.getState().resetProject();
    useLoreStore.getState().resetLoreEntries();
    useAutoSaveStore.getState().reset();
  });

  it("显示设定页标题与新建设定入口", () => {
    render(<LorePage />);

    expect(screen.getByRole("heading", { name: "设定" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "新建设定" })).toBeInTheDocument();
  });

  it("存在项目时允许新建设定并在列表中显示", async () => {
    const user = userEvent.setup();

    useProjectStore.getState().createProject("雨夜回响", "一段校园悬疑故事");

    render(<LorePage />);

    await user.click(screen.getByRole("button", { name: "新建设定" }));

    expect(screen.getByText("未命名设定 1")).toBeInTheDocument();
    expect(screen.getByLabelText("名称")).toHaveValue("未命名设定 1");
  });

  it("选择设定后允许编辑设定详情", async () => {
    const user = userEvent.setup();

    useProjectStore.getState().createProject("雨夜回响", "一段校园悬疑故事");

    render(<LorePage />);

    await user.click(screen.getByRole("button", { name: "新建设定" }));
    await user.clear(screen.getByLabelText("名称"));
    await user.type(screen.getByLabelText("名称"), "旧校舍");
    await user.clear(screen.getByLabelText("描述"));
    await user.type(screen.getByLabelText("描述"), "深夜会传来脚步声的旧建筑。");
    await user.selectOptions(screen.getByLabelText("分类"), "location");

    expect(screen.getByDisplayValue("旧校舍")).toBeInTheDocument();
    expect(screen.getByDisplayValue("深夜会传来脚步声的旧建筑。")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "旧校舍" })).toBeInTheDocument();
  });

  it("重载后会恢复设定列表与当前详情", async () => {
    useProjectStore.getState().createProject("雨夜回响", "一段校园悬疑故事");

    const currentProject = useProjectStore.getState().currentProject;
    if (!currentProject) {
      throw new Error("当前项目应已创建");
    }

    const firstLore = useLoreStore.getState().createLoreEntry(currentProject.id);
    if (!firstLore) {
      throw new Error("设定应可创建");
    }

    useLoreStore.getState().updateLoreEntry(firstLore.id, {
      name: "旧校舍",
    });

    vi.resetModules();

    const { LorePage: ReloadedLorePage } = await import("./LorePage");

    render(<ReloadedLorePage />);

    expect(screen.getByRole("button", { name: "旧校舍" })).toBeInTheDocument();
    expect(screen.getByDisplayValue("旧校舍")).toBeInTheDocument();
  });

  it("会展示与当前设定命中的场景基础关联", async () => {
    useProjectStore.getState().createProject("雨夜回响", "一段校园悬疑故事");

    const currentProject = useProjectStore.getState().currentProject;
    if (!currentProject) {
      throw new Error("当前项目应已创建");
    }

    const entry = useLoreStore
      .getState()
      .createLoreEntry(currentProject.id);
    if (!entry) {
      throw new Error("设定应可创建");
    }

    useLoreStore.getState().updateLoreEntry(entry.id, {
      name: "旧校舍",
      tags: ["雨夜回响"],
    });

    useProjectStore.setState({
      currentProject: {
        ...currentProject,
        scenes: [
          createScene({
            id: "scene-1",
            projectId: currentProject.id,
            routeId: currentProject.routes[0]?.id ?? "route-1",
            title: "第四章",
            summary: "旧校舍的传闻一直没人证实。",
            blocks: [
              {
                id: "block-1",
                sceneId: "scene-1",
                blockType: "narration",
                sortOrder: 0,
                characterId: null,
                contentText: "每到雨夜回响，旧校舍里就会亮起微弱的灯。",
                metaJson: null,
              },
            ],
          }),
        ],
      },
    });

    render(<LorePage />);

    expect(screen.getByRole("heading", { name: "与场景的基础关联" })).toBeInTheDocument();
    expect(screen.getByText("第四章")).toBeInTheDocument();
    expect(screen.getByText("命中字段：简介、正文块 1")).toBeInTheDocument();
    expect(screen.getByText("提及内容：旧校舍的传闻一直没人证实。")).toBeInTheDocument();
  });

  it("没有命中时会显示空态", () => {
    useProjectStore.getState().createProject("雨夜回响", "一段校园悬疑故事");

    const currentProject = useProjectStore.getState().currentProject;
    if (!currentProject) {
      throw new Error("当前项目应已创建");
    }

    const entry = useLoreStore
      .getState()
      .createLoreEntry(currentProject.id);
    if (!entry) {
      throw new Error("设定应可创建");
    }

    useLoreStore.getState().updateLoreEntry(entry.id, {
      name: "旧校舍",
    });

    useProjectStore.setState({
      currentProject: {
        ...currentProject,
        scenes: [
          createScene({
            id: "scene-1",
            projectId: currentProject.id,
            routeId: currentProject.routes[0]?.id ?? "route-1",
            title: "体育馆",
            summary: "这里不会提到设定里的关键词。",
            blocks: [
              {
                id: "block-1",
                sceneId: "scene-1",
                blockType: "narration",
                sortOrder: 0,
                characterId: null,
                contentText: "完全无关的正文内容。",
                metaJson: null,
              },
            ],
          }),
        ],
      },
    });

    render(<LorePage />);

    expect(
      screen.getByText("当前设定还没有在场景标题、简介或正文中被提及。"),
    ).toBeInTheDocument();
  });
});
