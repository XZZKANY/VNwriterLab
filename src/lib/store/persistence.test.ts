import { beforeEach, describe, expect, it, vi } from "vitest";

const PROJECT_STORAGE_KEY = "vn-writer-lab.project-store";
const EDITOR_STORAGE_KEY = "vn-writer-lab.editor-store";

describe("store persistence", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetModules();
  });

  it("创建项目后会持久化并在重载后恢复", async () => {
    const [{ useProjectStore }, { useAutoSaveStore }] = await Promise.all([
      import("../../features/projects/store/useProjectStore"),
      import("./useAutoSaveStore"),
    ]);

    useProjectStore.getState().createProject("雨夜回响", "一段校园悬疑故事");

    expect(localStorage.getItem(PROJECT_STORAGE_KEY)).not.toBeNull();
    expect(useAutoSaveStore.getState().lastSavedAt).not.toBeNull();

    vi.resetModules();

    const { useProjectStore: reloadedProjectStore } = await import(
      "../../features/projects/store/useProjectStore"
    );

    expect(reloadedProjectStore.getState().currentProject?.name).toBe("雨夜回响");
    expect(reloadedProjectStore.getState().currentProject?.summary).toBe(
      "一段校园悬疑故事",
    );
  });

  it("创建场景和内容块后会持久化并在重载后恢复", async () => {
    const [{ useEditorStore }, { useAutoSaveStore }] = await Promise.all([
      import("../../features/editor/store/useEditorStore"),
      import("./useAutoSaveStore"),
    ]);

    useEditorStore.getState().createScene();
    useEditorStore.getState().addBlock("narration");

    expect(localStorage.getItem(EDITOR_STORAGE_KEY)).not.toBeNull();
    expect(useAutoSaveStore.getState().lastSavedAt).not.toBeNull();

    vi.resetModules();

    const { useEditorStore: reloadedEditorStore } = await import(
      "../../features/editor/store/useEditorStore"
    );

    expect(reloadedEditorStore.getState().scenes).toHaveLength(1);
    expect(reloadedEditorStore.getState().scenes[0]?.blocks).toHaveLength(1);
    expect(reloadedEditorStore.getState().selectedSceneId).toBe(
      reloadedEditorStore.getState().scenes[0]?.id,
    );
  });
});
