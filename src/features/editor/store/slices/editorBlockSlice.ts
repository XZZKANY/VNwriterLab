import { withAutosave } from "@/lib/store/autosave";
import { useAutoSaveStore } from "@/lib/store/useAutoSaveStore";
import type { Scene } from "@/lib/domain/scene";
import {
  createDefaultConditionBlockMeta,
  stringifyConditionBlockMeta,
  type ConditionBlockMeta,
} from "../conditionBlock";
import { normalizeEditorSceneBlocks } from "../editorSceneUtils";
import {
  createDefaultNoteBlockMeta,
  stringifyNoteBlockMeta,
  type NoteBlockMeta,
} from "../noteBlock";
import type {
  EditorBlockSlice,
  EditorSliceCreator,
} from "../editorStore.types";
import {
  saveProjectLinksSnapshot,
  saveSceneBlocksSnapshot,
} from "./repositorySnapshots";

function withSceneBlocks(
  scenes: Scene[],
  sceneId: string,
  mapBlocks: (blocks: Scene["blocks"]) => Scene["blocks"],
): Scene[] {
  return scenes.map((scene) =>
    scene.id === sceneId
      ? {
          ...scene,
          blocks: mapBlocks(scene.blocks),
        }
      : scene,
  );
}

function swapBlocks(
  blocks: Scene["blocks"],
  index: number,
  direction: -1 | 1,
): Scene["blocks"] | null {
  const swapIndex = index + direction;
  if (index < 0 || swapIndex < 0 || swapIndex >= blocks.length) {
    return null;
  }

  const next = [...blocks];
  const a = next[index];
  const b = next[swapIndex];
  if (!a || !b) {
    return null;
  }

  next[index] = b;
  next[swapIndex] = a;

  return next;
}

export const createEditorBlockSlice: EditorSliceCreator<EditorBlockSlice> = (
  set,
  get,
) => {
  function moveBlock(sceneId: string, blockId: string, direction: -1 | 1) {
    const scene = get().scenes.find((item) => item.id === sceneId);
    if (!scene) {
      return;
    }

    const currentIndex = scene.blocks.findIndex(
      (block) => block.id === blockId,
    );
    const swapped = swapBlocks(scene.blocks, currentIndex, direction);
    if (!swapped) {
      return;
    }

    useAutoSaveStore.getState().markDirty();

    const nextScenes = withSceneBlocks(get().scenes, sceneId, () =>
      normalizeEditorSceneBlocks(swapped),
    );

    set({ scenes: nextScenes });

    useAutoSaveStore.getState().markSaved();
    saveSceneBlocksSnapshot(sceneId, nextScenes);
  }

  function updateBlockMeta(sceneId: string, blockId: string, nextMeta: string) {
    const scene = get().scenes.find((item) => item.id === sceneId);
    const block = scene?.blocks.find((item) => item.id === blockId);
    if (!scene || !block) {
      return;
    }

    useAutoSaveStore.getState().markDirty();

    const nextScenes = withSceneBlocks(get().scenes, sceneId, (blocks) =>
      blocks.map((currentBlock) =>
        currentBlock.id === blockId
          ? { ...currentBlock, metaJson: nextMeta }
          : currentBlock,
      ),
    );

    set({ scenes: nextScenes });

    useAutoSaveStore.getState().markSaved();
    saveSceneBlocksSnapshot(sceneId, nextScenes);
  }

  return {
    addBlock(blockType) {
      const { scenes, selectedSceneId } = get();
      if (!selectedSceneId) {
        return;
      }

      useAutoSaveStore.getState().markDirty();

      const nextScenes = withSceneBlocks(scenes, selectedSceneId, (blocks) => [
        ...blocks,
        {
          id: crypto.randomUUID(),
          sceneId: selectedSceneId,
          blockType,
          sortOrder: blocks.length,
          characterId: null,
          contentText: "",
          metaJson:
            blockType === "condition"
              ? stringifyConditionBlockMeta({
                  ...createDefaultConditionBlockMeta(),
                  conditions: [
                    {
                      variableId: get().variables[0]?.id ?? null,
                      operator: "isTrue",
                      compareValue: 1,
                    },
                  ],
                })
              : blockType === "note"
                ? stringifyNoteBlockMeta(createDefaultNoteBlockMeta())
                : null,
        },
      ]);

      set({ scenes: nextScenes });

      useAutoSaveStore.getState().markSaved();
      saveSceneBlocksSnapshot(selectedSceneId, nextScenes);
    },
    deleteBlock(sceneId, blockId) {
      const scene = get().scenes.find((item) => item.id === sceneId);
      const targetBlock = scene?.blocks.find((item) => item.id === blockId);
      if (!scene || !targetBlock) {
        return;
      }

      useAutoSaveStore.getState().markDirty();

      const nextLinks =
        targetBlock.blockType === "choice"
          ? get().links.filter((link) => link.sourceBlockId !== blockId)
          : get().links;

      const nextScenes = withSceneBlocks(get().scenes, sceneId, (blocks) =>
        normalizeEditorSceneBlocks(
          blocks.filter((block) => block.id !== blockId),
        ),
      );

      set({
        scenes: nextScenes,
        links: nextLinks,
      });

      useAutoSaveStore.getState().markSaved();
      saveSceneBlocksSnapshot(sceneId, nextScenes);
      saveProjectLinksSnapshot(scene.projectId, nextLinks);
    },
    moveBlockUp(sceneId, blockId) {
      moveBlock(sceneId, blockId, -1);
    },
    moveBlockDown(sceneId, blockId) {
      moveBlock(sceneId, blockId, 1);
    },
    updateBlockContent: withAutosave(
      (sceneId: string, blockId: string, contentText: string) => {
        const nextScenes = withSceneBlocks(get().scenes, sceneId, (blocks) =>
          blocks.map((block) =>
            block.id === blockId ? { ...block, contentText } : block,
          ),
        );

        set({ scenes: nextScenes });

        saveSceneBlocksSnapshot(sceneId, nextScenes);
      },
    ),
    updateConditionBlock(sceneId, blockId, input: ConditionBlockMeta) {
      updateBlockMeta(sceneId, blockId, stringifyConditionBlockMeta(input));
    },
    updateNoteBlock(sceneId, blockId, input: NoteBlockMeta) {
      updateBlockMeta(sceneId, blockId, stringifyNoteBlockMeta(input));
    },
  };
};
