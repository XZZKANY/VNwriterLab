import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Scene } from "@/lib/domain/scene";
import type { SceneLink } from "@/lib/domain/link";
import type { ProjectVariable } from "@/lib/domain/variable";
import type { ReferenceRepository } from "@/lib/repositories/referenceRepository";
import type { StoryRepository } from "@/lib/repositories/storyRepository";
import {
  resetReferenceRepositoryForTesting,
  setReferenceRepositoryForTesting,
} from "@/lib/repositories/referenceRepositoryRuntime";
import {
  resetStoryRepositoryForTesting,
  setStoryRepositoryForTesting,
} from "@/lib/repositories/storyRepositoryRuntime";
import {
  saveProjectLinksSnapshot,
  saveProjectVariablesSnapshot,
  saveSceneBlocksSnapshot,
  saveSceneSnapshot,
} from "./repositorySnapshots";

function makeScene(overrides: Partial<Scene> = {}): Scene {
  return {
    id: "s1",
    projectId: "p1",
    routeId: "r1",
    title: "测试",
    summary: "",
    sceneType: "normal",
    status: "draft",
    chapterLabel: "",
    sortOrder: 0,
    isStartScene: false,
    isEndingScene: false,
    notes: "",
    blocks: [],
    ...overrides,
  };
}

function makeLink(overrides: Partial<SceneLink> = {}): SceneLink {
  return {
    id: "l1",
    projectId: "p1",
    fromSceneId: "s1",
    toSceneId: "s2",
    linkType: "choice",
    sourceBlockId: "b1",
    label: "",
    conditionId: null,
    priorityOrder: 0,
    ...overrides,
  };
}

function makeVariable(
  overrides: Partial<ProjectVariable> = {},
): ProjectVariable {
  return {
    id: "v1",
    projectId: "p1",
    name: "var",
    variableType: "flag",
    defaultValue: 0,
    ...overrides,
  };
}

interface FakeStoryRepo {
  listScenes: ReturnType<typeof vi.fn>;
  createScene: ReturnType<typeof vi.fn>;
  updateScene: ReturnType<typeof vi.fn>;
  deleteScene: ReturnType<typeof vi.fn>;
  saveBlocks: ReturnType<typeof vi.fn>;
  listLinks: ReturnType<typeof vi.fn>;
  saveLinks: ReturnType<typeof vi.fn>;
}

interface FakeReferenceRepo {
  listCharacters: ReturnType<typeof vi.fn>;
  saveCharacter: ReturnType<typeof vi.fn>;
  listLoreEntries: ReturnType<typeof vi.fn>;
  saveLoreEntry: ReturnType<typeof vi.fn>;
  listVariables: ReturnType<typeof vi.fn>;
  saveVariable: ReturnType<typeof vi.fn>;
  saveVariables: ReturnType<typeof vi.fn>;
}

function buildFakeStoryRepo(): FakeStoryRepo {
  return {
    listScenes: vi.fn(async () => []),
    createScene: vi.fn(async () => makeScene()),
    updateScene: vi.fn(async () => undefined),
    deleteScene: vi.fn(async () => undefined),
    saveBlocks: vi.fn(async () => undefined),
    listLinks: vi.fn(async () => []),
    saveLinks: vi.fn(async () => undefined),
  };
}

function buildFakeReferenceRepo(): FakeReferenceRepo {
  return {
    listCharacters: vi.fn(async () => []),
    saveCharacter: vi.fn(async () => undefined),
    listLoreEntries: vi.fn(async () => []),
    saveLoreEntry: vi.fn(async () => undefined),
    listVariables: vi.fn(async () => []),
    saveVariable: vi.fn(async () => undefined),
    saveVariables: vi.fn(async () => undefined),
  };
}

describe("repositorySnapshots", () => {
  let storyRepo: FakeStoryRepo;
  let referenceRepo: FakeReferenceRepo;

  beforeEach(() => {
    storyRepo = buildFakeStoryRepo();
    referenceRepo = buildFakeReferenceRepo();
    // vi.fn() 的返回类型在 strict 模式下不直接满足 RepositoryInterface，
    // 但行为完全等价；通过 unknown 桥接传入 setForTesting。
    setStoryRepositoryForTesting(storyRepo as unknown as StoryRepository);
    setReferenceRepositoryForTesting(
      referenceRepo as unknown as ReferenceRepository,
    );
  });

  afterEach(() => {
    resetStoryRepositoryForTesting();
    resetReferenceRepositoryForTesting();
  });

  describe("saveSceneSnapshot", () => {
    it("找到目标场景时调用 storyRepo.updateScene", () => {
      const target = makeScene({ id: "s1", title: "目标" });
      saveSceneSnapshot("s1", [makeScene({ id: "other" }), target]);

      expect(storyRepo.updateScene).toHaveBeenCalledTimes(1);
      expect(storyRepo.updateScene).toHaveBeenCalledWith(target);
    });

    it("找不到场景时不调用 repo", () => {
      saveSceneSnapshot("missing", [makeScene({ id: "other" })]);
      expect(storyRepo.updateScene).not.toHaveBeenCalled();
    });
  });

  describe("saveSceneBlocksSnapshot", () => {
    it("找到目标场景时调用 storyRepo.saveBlocks（仅传 sceneId 和 blocks）", () => {
      const blocks = [
        {
          id: "b1",
          sceneId: "s1",
          blockType: "narration" as const,
          sortOrder: 0,
          characterId: null,
          contentText: "test",
          metaJson: null,
        },
      ];
      saveSceneBlocksSnapshot("s1", [makeScene({ id: "s1", blocks })]);

      expect(storyRepo.saveBlocks).toHaveBeenCalledTimes(1);
      expect(storyRepo.saveBlocks).toHaveBeenCalledWith("s1", blocks);
    });

    it("找不到场景时不调用 repo", () => {
      saveSceneBlocksSnapshot("missing", [makeScene({ id: "other" })]);
      expect(storyRepo.saveBlocks).not.toHaveBeenCalled();
    });
  });

  describe("saveProjectLinksSnapshot", () => {
    it("把 links 按 projectId 过滤后写入 repo", () => {
      const inProject = makeLink({ id: "in", projectId: "p1" });
      const otherProject = makeLink({ id: "out", projectId: "other" });

      saveProjectLinksSnapshot("p1", [inProject, otherProject]);

      expect(storyRepo.saveLinks).toHaveBeenCalledTimes(1);
      expect(storyRepo.saveLinks).toHaveBeenCalledWith("p1", [inProject]);
    });

    it("没有匹配的 links 时仍调用 repo（写入空数组以清空）", () => {
      saveProjectLinksSnapshot("p1", [
        makeLink({ id: "out", projectId: "other" }),
      ]);
      expect(storyRepo.saveLinks).toHaveBeenCalledWith("p1", []);
    });
  });

  describe("saveProjectVariablesSnapshot", () => {
    it("把 variables 按 projectId 过滤后写入 referenceRepo", () => {
      const inProject = makeVariable({ id: "v_in", projectId: "p1" });
      const otherProject = makeVariable({ id: "v_out", projectId: "other" });

      saveProjectVariablesSnapshot("p1", [inProject, otherProject]);

      expect(referenceRepo.saveVariables).toHaveBeenCalledTimes(1);
      expect(referenceRepo.saveVariables).toHaveBeenCalledWith("p1", [
        inProject,
      ]);
    });

    it("没有匹配 variables 时仍调用（写入空数组）", () => {
      saveProjectVariablesSnapshot("p1", [
        makeVariable({ id: "v_out", projectId: "other" }),
      ]);
      expect(referenceRepo.saveVariables).toHaveBeenCalledWith("p1", []);
    });
  });
});
