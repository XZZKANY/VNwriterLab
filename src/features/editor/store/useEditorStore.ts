import { create } from "zustand";
import type { SceneBlock } from "../../../lib/domain/block";
import type { Scene } from "../../../lib/domain/scene";
import type { ProjectVariable } from "../../../lib/domain/variable";
import type { SceneLink } from "./linkUtils";

interface EditorState {
  scenes: Scene[];
  selectedSceneId: string | null;
  links: SceneLink[];
  variables: ProjectVariable[];
  createScene: () => void;
  addBlock: (blockType: SceneBlock["blockType"]) => void;
}

export const useEditorStore = create<EditorState>((set, get) => ({
  scenes: [],
  selectedSceneId: null,
  links: [],
  variables: [],
  createScene: () => {
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
  },
  addBlock: (blockType) => {
    const { scenes, selectedSceneId } = get();
    if (!selectedSceneId) {
      return;
    }

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
  },
}));
