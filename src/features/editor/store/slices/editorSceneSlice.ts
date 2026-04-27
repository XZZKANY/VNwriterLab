import { clearChoiceBlockTargetSceneId } from "../choiceBlock";
import {
  normalizeEditorScenesByRoute,
  sortEditorScenesByRouteAndOrder,
} from "../editorSceneUtils";
import { withAutosave } from "@/lib/store/autosave";
import { useAutoSaveStore } from "@/lib/store/useAutoSaveStore";
import type {
  EditorSceneSlice,
  EditorSliceCreator,
} from "../editorStore.types";
import {
  saveProjectLinksSnapshot,
  saveSceneSnapshot,
} from "./repositorySnapshots";

export const createEditorSceneSlice: EditorSliceCreator<EditorSceneSlice> = (
  set,
  get,
) => ({
  scenes: [],
  selectedSceneId: null,
  createScene: withAutosave(
    (input?: { projectId?: string; routeId?: string }) => {
      const nextIndex = get().scenes.length + 1;
      const sceneId = crypto.randomUUID();

      set({
        scenes: [
          ...get().scenes,
          {
            id: sceneId,
            projectId: input?.projectId ?? "local-project",
            routeId: input?.routeId ?? "default-route",
            title: `未命名场景 ${nextIndex}`,
            summary: "",
            sceneType: "normal",
            status: "draft",
            chapterLabel: "",
            sortOrder: nextIndex - 1,
            isStartScene: nextIndex === 1,
            isEndingScene: false,
            notes: "",
            blocks: [],
          },
        ],
        selectedSceneId: sceneId,
      });
    },
  ),
  importScene: withAutosave((scene) => {
    set({
      scenes: [...get().scenes, scene],
      selectedSceneId: scene.id,
    });
  }),
  selectScene(sceneId) {
    set({ selectedSceneId: sceneId });
  },
  updateScene(sceneId, input) {
    const targetScene = get().scenes.find((scene) => scene.id === sceneId);
    if (!targetScene) {
      return;
    }

    useAutoSaveStore.getState().markDirty();

    const nextScenes = get().scenes.map((scene) =>
      scene.id === sceneId ? { ...scene, ...input } : scene,
    );

    set({
      scenes: nextScenes,
    });

    useAutoSaveStore.getState().markSaved();
    saveSceneSnapshot(sceneId, nextScenes);
  },
  deleteScene(sceneId) {
    const targetScene = get().scenes.find((scene) => scene.id === sceneId);
    if (!targetScene) {
      return;
    }

    useAutoSaveStore.getState().markDirty();

    const orderedScenes = sortEditorScenesByRouteAndOrder(get().scenes);
    const deletedIndex = orderedScenes.findIndex(
      (scene) => scene.id === sceneId,
    );
    const remainingScenes = orderedScenes.filter(
      (scene) => scene.id !== sceneId,
    );
    const nextSelectedSceneId =
      get().selectedSceneId === sceneId
        ? (remainingScenes[deletedIndex]?.id ??
          remainingScenes[remainingScenes.length - 1]?.id ??
          null)
        : get().selectedSceneId;

    const nextScenes = normalizeEditorScenesByRoute(remainingScenes).map(
      (scene) => ({
        ...scene,
        blocks: scene.blocks.map((block) => {
          if (block.blockType === "choice") {
            const nextMetaJson = clearChoiceBlockTargetSceneId(
              block.metaJson,
              sceneId,
            );
            if (nextMetaJson !== block.metaJson) {
              return {
                ...block,
                metaJson: nextMetaJson,
              };
            }
          }

          return block;
        }),
      }),
    );
    const nextLinks = get().links.filter(
      (link) => link.fromSceneId !== sceneId && link.toSceneId !== sceneId,
    );

    set({
      scenes: nextScenes,
      links: nextLinks,
      selectedSceneId: nextSelectedSceneId,
    });

    useAutoSaveStore.getState().markSaved();
    saveProjectLinksSnapshot(targetScene.projectId, nextLinks);
  },
});
