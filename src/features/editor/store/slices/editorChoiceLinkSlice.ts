import { useAutoSaveStore } from "@/lib/store/useAutoSaveStore";
import { stringifyChoiceBlockMeta } from "../choiceBlock";
import type {
  EditorChoiceLinkSlice,
  EditorSliceCreator,
} from "../editorStore.types";
import { buildChoiceLink } from "../linkUtils";
import {
  saveProjectLinksSnapshot,
  saveSceneBlocksSnapshot,
} from "./repositorySnapshots";

export const createEditorChoiceLinkSlice: EditorSliceCreator<
  EditorChoiceLinkSlice
> = (set, get) => ({
  links: [],
  updateChoiceBlock(sceneId, blockId, input) {
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
});
