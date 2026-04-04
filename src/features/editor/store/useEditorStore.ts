import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { SceneBlock } from "../../../lib/domain/block";
import type { Scene } from "../../../lib/domain/scene";
import type { ProjectVariable } from "../../../lib/domain/variable";
import { useAutoSaveStore } from "../../../lib/store/useAutoSaveStore";
import type { SceneLink } from "./linkUtils";

interface EditorState {
  scenes: Scene[];
  selectedSceneId: string | null;
  links: SceneLink[];
  variables: ProjectVariable[];
  createScene: () => void;
  addBlock: (blockType: SceneBlock["blockType"]) => void;
  resetEditor: () => void;
}

export const EDITOR_STORAGE_KEY = "vn-writer-lab.editor-store";

const initialState = {
  scenes: [] as Scene[],
  selectedSceneId: null as string | null,
  links: [] as SceneLink[],
  variables: [] as ProjectVariable[],
};

export const useEditorStore = create<EditorState>()(
  persist(
    (set, get) => ({
      ...initialState,
      createScene: () => {
        useAutoSaveStore.getState().markDirty();

        const nextIndex = get().scenes.length + 1;
        const sceneId = crypto.randomUUID();

        set({
          scenes: [
            ...get().scenes,
            {
              id: sceneId,
              projectId: "local-project",
              routeId: "default-route",
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

        useAutoSaveStore.getState().markSaved();
      },
      addBlock: (blockType) => {
        const { scenes, selectedSceneId } = get();
        if (!selectedSceneId) {
          return;
        }

        useAutoSaveStore.getState().markDirty();

        set({
          scenes: scenes.map((scene) =>
            scene.id === selectedSceneId
              ? {
                  ...scene,
                  blocks: [
                    ...scene.blocks,
                    {
                      id: crypto.randomUUID(),
                      sceneId: scene.id,
                      blockType,
                      sortOrder: scene.blocks.length,
                      characterId: null,
                      contentText: "",
                      metaJson: null,
                    },
                  ],
                }
              : scene,
          ),
        });

        useAutoSaveStore.getState().markSaved();
      },
      resetEditor: () => set(initialState),
    }),
    {
      name: EDITOR_STORAGE_KEY,
      partialize: (state) => ({
        scenes: state.scenes,
        selectedSceneId: state.selectedSceneId,
        links: state.links,
        variables: state.variables,
      }),
      onRehydrateStorage: () => {
        const restored = localStorage.getItem(EDITOR_STORAGE_KEY) !== null;

        return () => {
          useAutoSaveStore.getState().markHydrated(restored);
        };
      },
    },
  ),
);
