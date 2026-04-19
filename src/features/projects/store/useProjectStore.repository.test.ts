import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createEmptyProject,
  createSceneInRoute as createProjectSceneInRoute,
  type Project,
  type ProjectTemplate,
} from "../../../lib/domain/project";
import { useAutoSaveStore } from "../../../lib/store/useAutoSaveStore";
import {
  resetProjectRepositoryForTesting,
  setProjectRepositoryForTesting,
} from "../../../lib/repositories/projectRepositoryRuntime";
import {
  resetStoryRepositoryForTesting,
  setStoryRepositoryForTesting,
} from "../../../lib/repositories/storyRepositoryRuntime";
import type { StoryRepository } from "../../../lib/repositories/storyRepository";
import { useEditorStore } from "../../editor/store/useEditorStore";
import { useProjectStore } from "./useProjectStore";

function createStoredProject(): Project {
  const project = createEmptyProject("雨夜回响", "一段校园悬疑故事", "blank");
  const routeId = project.routes[0]!.id;
  const scene = createProjectSceneInRoute({
    projectId: project.id,
    routeId,
    sortOrder: 0,
  });

  return {
    ...project,
    scenes: [
      {
        ...scene,
        title: "开场",
        summary: "雨夜里传来脚步声。",
      },
    ],
  };
}

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
      const project =
        input.project ??
        createEmptyProject(
          input.name,
          input.summary,
          input.template ?? "blank",
        );
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
    listProjects,
    getProject,
    createProject,
    updateProject,
  };
}

function createFakeStoryRepository() {
  const updateScene = vi.fn(async () => undefined);
  const deleteScene = vi.fn(async () => undefined);
  const repository: StoryRepository = {
    listScenes: vi.fn(async () => []),
    createScene: vi.fn(async (input) => input.scene ?? createStoredProject().scenes[0]!),
    updateScene,
    deleteScene,
    saveBlocks: vi.fn(async () => undefined),
    listLinks: vi.fn(async () => []),
    saveLinks: vi.fn(async () => undefined),
  };

  return {
    repository,
    updateScene,
    deleteScene,
  };
}

describe("useProjectStore repository", () => {
  beforeEach(() => {
    localStorage.clear();
    useProjectStore.getState().resetProject();
    useEditorStore.getState().resetEditor();
    useAutoSaveStore.getState().reset();
    resetProjectRepositoryForTesting();
    resetStoryRepositoryForTesting();
  });

  it("hydrateLatestProject 会从 repository 恢复项目并同步 editor 场景", async () => {
    const storedProject = createStoredProject();
    const fake = createFakeProjectRepository([storedProject]);
    setProjectRepositoryForTesting(fake.repository);

    await useProjectStore.getState().hydrateLatestProject();

    expect(fake.listProjects).toHaveBeenCalledTimes(1);
    expect(fake.getProject).toHaveBeenCalledWith(storedProject.id);
    expect(useProjectStore.getState().currentProject).toMatchObject({
      id: storedProject.id,
      name: "雨夜回响",
    });
    expect(useEditorStore.getState().scenes).toHaveLength(1);
    expect(useEditorStore.getState().scenes[0]).toMatchObject({
      id: storedProject.scenes[0]!.id,
      title: "开场",
      summary: "雨夜里传来脚步声。",
    });
    expect(useAutoSaveStore.getState().hasRestoredDraft).toBe(true);
  });

  it("createProject 会把模板创建交给 repository 并同步 editor 场景", () => {
    const fake = createFakeProjectRepository();
    setProjectRepositoryForTesting(fake.repository);

    useProjectStore
      .getState()
      .createProject("雨夜回响", "一段校园悬疑故事", "multi_ending");

    expect(fake.createProject).toHaveBeenCalledWith({
      name: "雨夜回响",
      summary: "一段校园悬疑故事",
      template: "multi_ending",
      project: expect.objectContaining({
        name: "雨夜回响",
        summary: "一段校园悬疑故事",
      }),
    });
    expect(useProjectStore.getState().currentProject?.scenes).toHaveLength(3);
    expect(useEditorStore.getState().scenes).toHaveLength(3);
    expect(useAutoSaveStore.getState().lastSavedAt).not.toBeNull();
  });

  it("createRoute 与 createSceneInRoute 会通过 repository.updateProject 保存结构变更", () => {
    const fake = createFakeProjectRepository();
    const fakeStory = createFakeStoryRepository();
    setProjectRepositoryForTesting(fake.repository);
    setStoryRepositoryForTesting(fakeStory.repository);

    useProjectStore.getState().createProject("雨夜回响", "一段校园悬疑故事");
    const routeId = useProjectStore.getState().currentProject?.routes[0]?.id ?? "";

    useProjectStore.getState().createRoute("林夏线");
    const secondRouteId =
      useProjectStore.getState().currentProject?.routes[1]?.id ?? "";

    useProjectStore.getState().createSceneInRoute(routeId);
    useProjectStore.getState().createSceneInRoute(secondRouteId);

    expect(fake.updateProject).toHaveBeenCalled();
    expect(useProjectStore.getState().currentProject?.routes).toHaveLength(2);
    expect(useProjectStore.getState().currentProject?.scenes).toHaveLength(2);
    expect(fake.updateProject).toHaveBeenLastCalledWith(
      expect.objectContaining({
        routes: expect.arrayContaining([
          expect.objectContaining({ name: "林夏线" }),
        ]),
        scenes: expect.arrayContaining([
          expect.objectContaining({ routeId }),
          expect.objectContaining({ routeId: secondRouteId }),
        ]),
      }),
    );
    expect(fakeStory.updateScene).toHaveBeenCalledWith(
      expect.objectContaining({ routeId: secondRouteId }),
    );
  });

  it("删除和移动场景会同步 StoryRepository lifecycle", () => {
    const fake = createFakeProjectRepository();
    const fakeStory = createFakeStoryRepository();
    setProjectRepositoryForTesting(fake.repository);
    setStoryRepositoryForTesting(fakeStory.repository);

    useProjectStore.getState().createProject("雨夜回响", "一段校园悬疑故事");
    const routeId = useProjectStore.getState().currentProject?.routes[0]?.id ?? "";
    const firstScene = useProjectStore.getState().createSceneInRoute(routeId)!;
    const secondScene = useProjectStore.getState().createSceneInRoute(routeId)!;

    useProjectStore.getState().moveSceneUp(secondScene.id);
    useProjectStore.getState().deleteScene(firstScene.id);

    expect(fakeStory.updateScene).toHaveBeenCalledWith(
      expect.objectContaining({ id: secondScene.id, sortOrder: 0 }),
    );
    expect(fakeStory.deleteScene).toHaveBeenCalledWith(firstScene.id);
  });
});
