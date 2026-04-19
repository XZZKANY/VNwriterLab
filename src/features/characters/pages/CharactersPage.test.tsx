import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, vi } from "vitest";
import type { Project, ProjectTemplate } from "../../../lib/domain/project";
import {
  resetProjectRepositoryForTesting,
} from "../../../lib/repositories/projectRepositoryRuntime";
import {
  resetReferenceRepositoryForTesting,
  setReferenceRepositoryForTesting,
} from "../../../lib/repositories/referenceRepositoryRuntime";
import { useEditorStore } from "../../editor/store/useEditorStore";
import { useAutoSaveStore } from "../../../lib/store/useAutoSaveStore";
import { useProjectStore } from "../../projects/store/useProjectStore";
import { CharactersPage } from "./CharactersPage";

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
  };
}

function createFakeReferenceRepository() {
  const characters = new Map<string, { id: string; projectId: string; name: string; identity: string; appearance: string; personality: string; goal: string; secret: string; routeId: string | null; notes: string }>();

  return {
    repository: {
      listCharacters: vi.fn(async (projectId: string) =>
        [...characters.values()].filter((character) => character.projectId === projectId),
      ),
      saveCharacter: vi.fn(async (character) => {
        characters.set(character.id, character);
      }),
      listLoreEntries: vi.fn(async () => []),
      saveLoreEntry: vi.fn(async () => undefined),
      listVariables: vi.fn(async () => []),
      saveVariable: vi.fn(async () => undefined),
      saveVariables: vi.fn(async () => undefined),
    },
    seedCharacter(projectId = "p1") {
      characters.set("c1", {
        id: "c1",
        projectId,
        name: "林夏",
        identity: "学生会长",
        appearance: "",
        personality: "",
        goal: "",
        secret: "",
        routeId: null,
        notes: "",
      });
    },
  };
}

describe("CharactersPage", () => {
  beforeEach(() => {
    localStorage.clear();
    useProjectStore.getState().resetProject();
    useEditorStore.getState().resetEditor();
    useAutoSaveStore.getState().reset();
    resetProjectRepositoryForTesting();
    resetReferenceRepositoryForTesting();
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
    const fake = createFakeProjectRepository();
    const runtime = await import("../../../lib/repositories/projectRepositoryRuntime");
    runtime.setProjectRepositoryForTesting(fake.repository);
    const fakeReference = createFakeReferenceRepository();
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
    fakeReference.seedCharacter(useProjectStore.getState().currentProject!.id);

    vi.resetModules();
    const reloadedRuntime = await import("../../../lib/repositories/projectRepositoryRuntime");
    reloadedRuntime.setProjectRepositoryForTesting(fake.repository);
    const reloadedReferenceRuntime = await import(
      "../../../lib/repositories/referenceRepositoryRuntime"
    );
    reloadedReferenceRuntime.setReferenceRepositoryForTesting(
      fakeReference.repository,
    );
    const { useProjectStore: reloadedProjectStore } = await import(
      "../../projects/store/useProjectStore"
    );
    await reloadedProjectStore.getState().hydrateLatestProject();

    const { CharactersPage: ReloadedCharactersPage } = await import(
      "./CharactersPage"
    );

    render(<ReloadedCharactersPage />);

    expect(await screen.findByRole("button", { name: "林夏" })).toBeInTheDocument();
    expect(await screen.findByDisplayValue("林夏")).toBeInTheDocument();
  });

  it("当前项目已存在且角色列表为空时会自动 hydrate 角色", async () => {
    const fake = createFakeReferenceRepository();
    fake.seedCharacter();
    setReferenceRepositoryForTesting(fake.repository);
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

    render(<CharactersPage />);

    expect(await screen.findByRole("button", { name: "林夏" })).toBeInTheDocument();
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
    expect(screen.getByText("序章（2 处，首次出场）")).toBeInTheDocument();
    expect(screen.getByText("旧校舍（1 处）")).toBeInTheDocument();
  });

  it("会为最早出场的场景添加首次出场标记", async () => {
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

    useEditorStore.setState({
      scenes: [
        {
          id: "scene-first",
          projectId: currentProject.id,
          routeId,
          title: "初见",
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
              id: "block-first",
              sceneId: "scene-first",
              blockType: "dialogue",
              sortOrder: 0,
              characterId: createdCharacter!.id,
              contentText: "林夏第一次登场。",
              metaJson: null,
            },
          ],
        },
        {
          id: "scene-second",
          projectId: currentProject.id,
          routeId,
          title: "天台重逢",
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
              id: "block-second-a",
              sceneId: "scene-second",
              blockType: "dialogue",
              sortOrder: 0,
              characterId: createdCharacter!.id,
              contentText: "再次见到林夏。",
              metaJson: null,
            },
            {
              id: "block-second-b",
              sceneId: "scene-second",
              blockType: "narration",
              sortOrder: 1,
              characterId: createdCharacter!.id,
              contentText: "她已经在这里等了很久。",
              metaJson: null,
            },
          ],
        },
      ],
      selectedSceneId: "scene-first",
      links: [],
      variables: [],
      selectedVariableId: null,
    });

    render(<ReloadedCharactersPage />);

    await user.click(screen.getByRole("button", { name: "林夏" }));

    expect(screen.getByText("初见（1 处，首次出场）")).toBeInTheDocument();
    expect(screen.getByText("天台重逢（2 处）")).toBeInTheDocument();
  });
});
