import { create } from "zustand";
import type { SceneBlock } from "../../../lib/domain/block";
import { getStoryRepository } from "../../../lib/repositories/storyRepositoryRuntime";
import { useAutoSaveStore } from "../../../lib/store/useAutoSaveStore";
import {
  stringifyChoiceBlockMeta,
} from "./choiceBlock";
import {
  createDefaultConditionBlockMeta,
  stringifyConditionBlockMeta,
  type ConditionBlockMeta,
} from "./conditionBlock";
import { createEditorStoreState } from "./createEditorStoreState";
import { normalizeEditorSceneBlocks } from "./editorSceneUtils";
import type { EditorStoreState } from "./editorStore.types";
import { buildChoiceLink, type SceneLink } from "./linkUtils";
import {
  createDefaultNoteBlockMeta,
  stringifyNoteBlockMeta,
  type NoteBlockMeta,
} from "./noteBlock";

export const EDITOR_STORAGE_KEY = "vn-writer-lab.editor-store";

function saveSceneBlocksSnapshot(
  sceneId: string,
  scenes: EditorStoreState["scenes"],
) {
  const scene = scenes.find((item) => item.id === sceneId);
  if (!scene) {
    return;
  }

  void getStoryRepository().saveBlocks(sceneId, scene.blocks);
}

function saveProjectLinksSnapshot(projectId: string, links: SceneLink[]) {
  const projectLinks = links.filter((link) => link.projectId === projectId);

  void getStoryRepository().saveLinks(projectId, projectLinks);
}

export const useEditorStore = create<EditorStoreState>()((...args) => {
  const [set, get] = args;

  return {
    ...createEditorStoreState(...args),
    links: [] as SceneLink[],
    addBlock: (blockType) => {
      const { scenes, selectedSceneId } = get();
      if (!selectedSceneId) {
        return;
      }

      useAutoSaveStore.getState().markDirty();

      const nextScenes = scenes.map((scene) =>
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
              ],
            }
          : scene,
      );

      set({
        scenes: nextScenes,
      });

      useAutoSaveStore.getState().markSaved();
      saveSceneBlocksSnapshot(selectedSceneId, nextScenes);
    },
    deleteBlock: (sceneId, blockId) => {
      const scene = get().scenes.find((item) => item.id === sceneId);
      const targetBlock = scene?.blocks.find((item) => item.id === blockId);
      if (!scene || !targetBlock) {
        return;
      }

      useAutoSaveStore.getState().markDirty();

      const nextBlocks = scene.blocks.filter((block) => block.id !== blockId);
      const nextLinks =
        targetBlock.blockType === "choice"
          ? get().links.filter((link) => link.sourceBlockId !== blockId)
          : get().links;

      const nextScenes = get().scenes.map((item) =>
        item.id === sceneId
          ? {
              ...item,
              blocks: normalizeEditorSceneBlocks(nextBlocks),
            }
          : item,
      );

      set({
        scenes: nextScenes,
        links: nextLinks,
      });

      useAutoSaveStore.getState().markSaved();
      saveSceneBlocksSnapshot(sceneId, nextScenes);
      saveProjectLinksSnapshot(scene.projectId, nextLinks);
    },
    moveBlockUp: (sceneId, blockId) => {
      const scene = get().scenes.find((item) => item.id === sceneId);
      if (!scene) {
        return;
      }

      const currentIndex = scene.blocks.findIndex((block) => block.id === blockId);
      if (currentIndex <= 0) {
        return;
      }

      useAutoSaveStore.getState().markDirty();

      const nextBlocks = [...scene.blocks];
      const previousBlock = nextBlocks[currentIndex - 1];
      const currentBlock = nextBlocks[currentIndex];
      if (!previousBlock || !currentBlock) {
        return;
      }

      nextBlocks[currentIndex - 1] = currentBlock;
      nextBlocks[currentIndex] = previousBlock;

      const nextScenes = get().scenes.map((item) =>
        item.id === sceneId
          ? {
              ...item,
              blocks: normalizeEditorSceneBlocks(nextBlocks),
            }
          : item,
      );

      set({
        scenes: nextScenes,
      });

      useAutoSaveStore.getState().markSaved();
      saveSceneBlocksSnapshot(sceneId, nextScenes);
    },
    moveBlockDown: (sceneId, blockId) => {
      const scene = get().scenes.find((item) => item.id === sceneId);
      if (!scene) {
        return;
      }

      const currentIndex = scene.blocks.findIndex((block) => block.id === blockId);
      if (currentIndex < 0 || currentIndex >= scene.blocks.length - 1) {
        return;
      }

      useAutoSaveStore.getState().markDirty();

      const nextBlocks = [...scene.blocks];
      const currentBlock = nextBlocks[currentIndex];
      const nextBlock = nextBlocks[currentIndex + 1];
      if (!currentBlock || !nextBlock) {
        return;
      }

      nextBlocks[currentIndex] = nextBlock;
      nextBlocks[currentIndex + 1] = currentBlock;

      const nextScenes = get().scenes.map((item) =>
        item.id === sceneId
          ? {
              ...item,
              blocks: normalizeEditorSceneBlocks(nextBlocks),
            }
          : item,
      );

      set({
        scenes: nextScenes,
      });

      useAutoSaveStore.getState().markSaved();
      saveSceneBlocksSnapshot(sceneId, nextScenes);
    },
    updateBlockContent: (sceneId, blockId, contentText) => {
      useAutoSaveStore.getState().markDirty();

      const nextScenes = get().scenes.map((scene) =>
        scene.id === sceneId
          ? {
              ...scene,
              blocks: scene.blocks.map((block) =>
                block.id === blockId ? { ...block, contentText } : block,
              ),
            }
          : scene,
      );

      set({
        scenes: nextScenes,
      });

      useAutoSaveStore.getState().markSaved();
      saveSceneBlocksSnapshot(sceneId, nextScenes);
    },
    updateChoiceBlock: (sceneId, blockId, input) => {
      const scene = get().scenes.find((item) => item.id === sceneId);
      const block = scene?.blocks.find((item) => item.id === blockId);
      if (!scene || !block) {
        return;
      }

      useAutoSaveStore.getState().markDirty();

      const meta = stringifyChoiceBlockMeta({
        label: input.label,
        targetSceneId: input.targetSceneId,
        effectVariableId: input.effectVariableId,
        effectValue: input.effectValue,
      });
      const nextLinks = get().links.filter(
        (link) => link.sourceBlockId !== blockId,
      );

      if (input.label.trim() && input.targetSceneId) {
        nextLinks.push(
          buildChoiceLink({
            projectId: scene.projectId,
            fromSceneId: sceneId,
            toSceneId: input.targetSceneId,
            sourceBlockId: blockId,
            label: input.label.trim(),
          }),
        );
      }

      const nextScenes = get().scenes.map((item) =>
        item.id === sceneId
          ? {
              ...item,
              blocks: item.blocks.map((currentBlock) =>
                currentBlock.id === blockId
                  ? {
                      ...currentBlock,
                      contentText: input.label,
                      metaJson: meta,
                    }
                  : currentBlock,
              ),
            }
          : item,
      );

      set({
        scenes: nextScenes,
        links: nextLinks,
      });

      useAutoSaveStore.getState().markSaved();
      saveSceneBlocksSnapshot(sceneId, nextScenes);
      saveProjectLinksSnapshot(scene.projectId, nextLinks);
    },
    updateConditionBlock: (sceneId, blockId, input: ConditionBlockMeta) => {
      const scene = get().scenes.find((item) => item.id === sceneId);
      const block = scene?.blocks.find((item) => item.id === blockId);
      if (!scene || !block) {
        return;
      }

      useAutoSaveStore.getState().markDirty();

      const nextMeta = stringifyConditionBlockMeta(input);

      const nextScenes = get().scenes.map((item) =>
        item.id === sceneId
          ? {
              ...item,
              blocks: item.blocks.map((currentBlock) =>
                currentBlock.id === blockId
                  ? {
                      ...currentBlock,
                      metaJson: nextMeta,
                    }
                  : currentBlock,
              ),
            }
          : item,
      );

      set({
        scenes: nextScenes,
      });

      useAutoSaveStore.getState().markSaved();
      saveSceneBlocksSnapshot(sceneId, nextScenes);
    },
    updateNoteBlock: (sceneId, blockId, input: NoteBlockMeta) => {
      const scene = get().scenes.find((item) => item.id === sceneId);
      const block = scene?.blocks.find((item) => item.id === blockId);
      if (!scene || !block) {
        return;
      }

      useAutoSaveStore.getState().markDirty();

      const nextMeta = stringifyNoteBlockMeta(input);

      const nextScenes = get().scenes.map((item) =>
        item.id === sceneId
          ? {
              ...item,
              blocks: item.blocks.map((currentBlock) =>
                currentBlock.id === blockId
                  ? {
                      ...currentBlock,
                      metaJson: nextMeta,
                    }
                  : currentBlock,
              ),
            }
          : item,
      );

      set({
        scenes: nextScenes,
      });

      useAutoSaveStore.getState().markSaved();
      saveSceneBlocksSnapshot(sceneId, nextScenes);
    },
  };
});
