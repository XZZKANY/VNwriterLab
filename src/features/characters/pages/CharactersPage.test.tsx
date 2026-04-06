import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, vi } from "vitest";
import { useEditorStore } from "../../editor/store/useEditorStore";
import { useAutoSaveStore } from "../../../lib/store/useAutoSaveStore";
import { useProjectStore } from "../../projects/store/useProjectStore";
import { CharactersPage } from "./CharactersPage";

describe("CharactersPage", () => {
  beforeEach(() => {
    localStorage.clear();
    useProjectStore.getState().resetProject();
    useEditorStore.getState().resetEditor();
    useAutoSaveStore.getState().reset();
  });

  it("显示角色页标题与新增按钮", () => {
    render(<CharactersPage />);

    expect(screen.getByRole("heading", { name: "角色" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "新增角色" })).toBeInTheDocument();
  });

  it("存在项目时允许新增角色并在列表中显示", async () => {
    const user = userEvent.setup();

    useProjectStore.getState().createProject("雨夜回响", "一段校园悬疑故事");

    render(<CharactersPage />);

    await user.click(screen.getByRole("button", { name: "新增角色" }));

    expect(screen.getByText("未命名角色 1")).toBeInTheDocument();
    expect(screen.getByLabelText("姓名")).toHaveValue("未命名角色 1");
  });

  it("选择角色后允许编辑角色详情", async () => {
    const user = userEvent.setup();

    useProjectStore.getState().createProject("雨夜回响", "一段校园悬疑故事");

    render(<CharactersPage />);

    await user.click(screen.getByRole("button", { name: "新增角色" }));
    await user.clear(screen.getByLabelText("姓名"));
    await user.type(screen.getByLabelText("姓名"), "林夏");
    await user.type(screen.getByLabelText("身份"), "学生会长");

    expect(screen.getByDisplayValue("林夏")).toBeInTheDocument();
    expect(screen.getByDisplayValue("学生会长")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "林夏" })).toBeInTheDocument();
  });

  it("重载后会恢复角色列表与当前详情", async () => {
    useProjectStore.getState().createProject("雨夜回响", "一段校园悬疑故事");

    const { useCharacterStore } = await import("../store/useCharacterStore");

    useCharacterStore.getState().createCharacter(
      useProjectStore.getState().currentProject!.id,
    );
    useCharacterStore.getState().updateCharacter(
      useCharacterStore.getState().selectedCharacterId!,
      {
        name: "林夏",
      },
    );

    vi.resetModules();

    const { CharactersPage: ReloadedCharactersPage } = await import(
      "./CharactersPage"
    );

    render(<ReloadedCharactersPage />);

    expect(screen.getByRole("button", { name: "林夏" })).toBeInTheDocument();
    expect(screen.getByDisplayValue("林夏")).toBeInTheDocument();
  });

  it("会展示角色关联路线与被场景引用信息", async () => {
    const user = userEvent.setup();

    const { useProjectStore } = await import("../../projects/store/useProjectStore");
    const { useEditorStore } = await import("../../editor/store/useEditorStore");
    const { CharactersPage: ReloadedCharactersPage } = await import("./CharactersPage");

    useProjectStore.getState().createProject("雨夜回响", "一段校园悬疑故事");

    const currentProject = useProjectStore.getState().currentProject!;
    const routeId = currentProject.routes[0].id;

    const { useCharacterStore } = await import("../store/useCharacterStore");

    const createdCharacter = useCharacterStore
      .getState()
      .createCharacter(currentProject.id);
    expect(createdCharacter).not.toBeNull();

    useCharacterStore.getState().updateCharacter(createdCharacter!.id, {
      routeId,
      name: "林夏",
    });

    useProjectStore.getState().createSceneInRoute(routeId);
    useProjectStore.getState().createSceneInRoute(routeId);
    useEditorStore.setState({
      scenes: [
        {
          id: "scene-a",
          projectId: currentProject.id,
          routeId,
          title: "序章",
          summary: "",
          sceneType: "normal",
          status: "draft",
          chapterLabel: "",
          sortOrder: 0,
          isStartScene: true,
          isEndingScene: false,
          notes: "",
          blocks: [
            {
              id: "block-a",
              sceneId: "scene-a",
              blockType: "dialogue",
              sortOrder: 0,
              characterId: createdCharacter!.id,
              contentText: "林夏低声说话。",
              metaJson: null,
            },
            {
              id: "block-b",
              sceneId: "scene-a",
              blockType: "narration",
              sortOrder: 1,
              characterId: createdCharacter!.id,
              contentText: "她看向窗外。",
              metaJson: null,
            },
          ],
        },
        {
          id: "scene-b",
          projectId: currentProject.id,
          routeId,
          title: "旧校舍",
          summary: "",
          sceneType: "branch",
          status: "draft",
          chapterLabel: "",
          sortOrder: 1,
          isStartScene: false,
          isEndingScene: false,
          notes: "",
          blocks: [
            {
              id: "block-c",
              sceneId: "scene-b",
              blockType: "dialogue",
              sortOrder: 0,
              characterId: createdCharacter!.id,
              contentText: "这里也有林夏。",
              metaJson: null,
            },
          ],
        },
      ],
      selectedSceneId: "scene-a",
      links: [],
      variables: [],
      selectedVariableId: null,
    });

    render(<ReloadedCharactersPage />);

    await user.click(screen.getByRole("button", { name: "林夏" }));

    expect(screen.getByRole("heading", { name: "与路线的关联" })).toBeInTheDocument();
    expect(screen.getByText("共通线")).toBeInTheDocument();
    expect(screen.getByText("默认创建的起始路线")).toBeInTheDocument();
    expect(screen.getByRole("list", { name: "路线场景列表" })).toBeInTheDocument();
    expect(screen.getByText("未命名场景 1")).toBeInTheDocument();
    expect(screen.getByText("未命名场景 2")).toBeInTheDocument();

    expect(screen.getByRole("heading", { name: "被哪些场景引用" })).toBeInTheDocument();
    expect(screen.getByText("当前角色在 2 个场景中被引用。")).toBeInTheDocument();
    expect(screen.getByRole("list", { name: "场景引用列表" })).toBeInTheDocument();
    expect(screen.getByText("序章（2 处）")).toBeInTheDocument();
    expect(screen.getByText("旧校舍（1 处）")).toBeInTheDocument();
  });
});
