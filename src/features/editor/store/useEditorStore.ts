import { create } from "zustand";
import type { SceneBlock } from "../../../lib/domain/block";
import type { Scene } from "../../../lib/domain/scene";
import {
  createEmptyVariable,
  type ProjectVariable,
  type VariableType,
} from "../../../lib/domain/variable";
import { getReferenceRepository } from "../../../lib/repositories/referenceRepositoryRuntime";
import { getStoryRepository } from "../../../lib/repositories/storyRepositoryRuntime";
import { useAutoSaveStore } from "../../../lib/store/useAutoSaveStore";
import {
  clearChoiceBlockEffectVariableId,
  clearChoiceBlockTargetSceneId,
  stringifyChoiceBlockMeta,
} from "./choiceBlock";
import {
  clearConditionBlockVariableId,
  createDefaultConditionBlockMeta,
  stringifyConditionBlockMeta,
  type ConditionBlockMeta,
} from "./conditionBlock";
import {
  createDefaultNoteBlockMeta,
  stringifyNoteBlockMeta,
  type NoteBlockMeta,
} from "./noteBlock";
import {
  normalizeEditorSceneBlocks,
  normalizeEditorScenesByRoute,
  sortEditorScenesByRouteAndOrder,
} from "./editorSceneUtils";
import { buildChoiceLink, type SceneLink } from "./linkUtils";

interface EditorState {
  scenes: Scene[];
  selectedSceneId: string | null;
  links: SceneLink[];
  variables: ProjectVariable[];
  selectedVariableId: string | null;
  hydrateScenes: (projectId: string) => Promise<void>;
  hydrateVariables: (projectId: string) => Promise<void>;
  createScene: (input?: { projectId?: string; routeId?: string }) => void;
  importScene: (scene: Scene) => void;
  selectScene: (sceneId: string) => void;
  updateScene: (
    sceneId: string,
    input: Partial<
      Pick<
        Scene,
        | "title"
        | "summary"
        | "sceneType"
        | "status"
        | "isStartScene"
        | "isEndingScene"
      >
    >,
  ) => void;
  deleteScene: (sceneId: string) => void;
  createVariable: (projectId: string) => ProjectVariable | null;
  selectVariable: (variableId: string) => void;
  deleteVariable: (variableId: string) => void;
  updateVariable: (
    variableId: string,
    input: Partial<
      Pick<ProjectVariable, "name" | "variableType" | "defaultValue">
    >,
  ) => void;
  addBlock: (blockType: SceneBlock["blockType"]) => void;
  deleteBlock: (sceneId: string, blockId: string) => void;
  moveBlockUp: (sceneId: string, blockId: string) => void;
  moveBlockDown: (sceneId: string, blockId: string) => void;
  updateBlockContent: (
    sceneId: string,
    blockId: string,
    contentText: string,
  ) => void;
  updateChoiceBlock: (
    sceneId: string,
    blockId: string,
    input: {
      label: string;
      targetSceneId: string | null;
      effectVariableId: string | null;
      effectValue: number;
    },
  ) => void;
  updateConditionBlock: (
    sceneId: string,
    blockId: string,
    input: ConditionBlockMeta,
  ) => void;
  updateNoteBlock: (
    sceneId: string,
    blockId: string,
    input: NoteBlockMeta,
  ) => void;
  resetEditor: () => void;
}

export const EDITOR_STORAGE_KEY = "vn-writer-lab.editor-store";

const initialState = {
  scenes: [] as Scene[],
  selectedSceneId: null as string | null,
  links: [] as SceneLink[],
  variables: [] as ProjectVariable[],
  selectedVariableId: null as string | null,
};

function saveProjectVariablesSnapshot(projectId: string, variables: ProjectVariable[]) {
  const projectVariables = variables.filter(
    (variable) => variable.projectId === projectId,
  );

  void getReferenceRepository().saveVariables(projectId, projectVariables);
}

function saveSceneSnapshot(sceneId: string, scenes: Scene[]) {
  const scene = scenes.find((item) => item.id === sceneId);
  if (!scene) {
    return;
  }

  void getStoryRepository().updateScene(scene);
}

function saveSceneBlocksSnapshot(sceneId: string, scenes: Scene[]) {
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

export const useEditorStore = create<EditorState>()((set, get) => ({
      ...initialState,
      hydrateScenes: async (projectId) => {
        const trimmedProjectId = projectId.trim();
        if (!trimmedProjectId) {
          useAutoSaveStore.getState().markHydrated(false);
          return;
        }

        const repository = getStoryRepository();
        const [projectScenes, projectLinks] = await Promise.all([
          repository.listScenes(trimmedProjectId),
          repository.listLinks(trimmedProjectId),
        ]);
        const otherScenes = get().scenes.filter(
          (scene) => scene.projectId !== trimmedProjectId,
        );
        const otherLinks = get().links.filter(
          (link) => link.projectId !== trimmedProjectId,
        );
        const currentSelectedSceneId = get().selectedSceneId;
        const nextSelectedSceneId =
          currentSelectedSceneId &&
          projectScenes.some((scene) => scene.id === currentSelectedSceneId)
            ? currentSelectedSceneId
            : projectScenes[0]?.id ?? null;

        set({
          scenes: [...otherScenes, ...projectScenes],
          links: [...otherLinks, ...projectLinks],
          selectedSceneId: nextSelectedSceneId,
        });

        useAutoSaveStore.getState().markHydrated(projectScenes.length > 0);
      },
      hydrateVariables: async (projectId) => {
        const trimmedProjectId = projectId.trim();
        if (!trimmedProjectId) {
          useAutoSaveStore.getState().markHydrated(false);
          return;
        }

        const projectVariables =
          await getReferenceRepository().listVariables(trimmedProjectId);
        const otherVariables = get().variables.filter(
          (variable) => variable.projectId !== trimmedProjectId,
        );
        const currentSelectedVariableId = get().selectedVariableId;
        const nextSelectedVariableId =
          currentSelectedVariableId &&
          projectVariables.some(
            (variable) => variable.id === currentSelectedVariableId,
          )
            ? currentSelectedVariableId
            : projectVariables[0]?.id ?? null;

        set({
          variables: [...otherVariables, ...projectVariables],
          selectedVariableId: nextSelectedVariableId,
        });

        useAutoSaveStore.getState().markHydrated(projectVariables.length > 0);
      },
      createScene: (input) => {
        useAutoSaveStore.getState().markDirty();

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

        useAutoSaveStore.getState().markSaved();
      },
      importScene: (scene) => {
        useAutoSaveStore.getState().markDirty();

        set({
          scenes: [...get().scenes, scene],
          selectedSceneId: scene.id,
        });

        useAutoSaveStore.getState().markSaved();
      },
      selectScene: (sceneId) => {
        set({ selectedSceneId: sceneId });
      },
      updateScene: (sceneId, input) => {
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
      deleteScene: (sceneId) => {
        const targetScene = get().scenes.find((scene) => scene.id === sceneId);
        if (!targetScene) {
          return;
        }

        useAutoSaveStore.getState().markDirty();

        const orderedScenes = sortEditorScenesByRouteAndOrder(get().scenes);
        const deletedIndex = orderedScenes.findIndex((scene) => scene.id === sceneId);
        const remainingScenes = orderedScenes.filter((scene) => scene.id !== sceneId);
        const nextSelectedSceneId =
          get().selectedSceneId === sceneId
            ? remainingScenes[deletedIndex]?.id ??
              remainingScenes[remainingScenes.length - 1]?.id ??
              null
            : get().selectedSceneId;

        const nextScenes = normalizeEditorScenesByRoute(remainingScenes).map((scene) => ({
          ...scene,
          blocks: scene.blocks.map((block) => {
            if (block.blockType === "choice") {
              const nextMetaJson = clearChoiceBlockTargetSceneId(block.metaJson, sceneId);
              if (nextMetaJson !== block.metaJson) {
                return {
                  ...block,
                  metaJson: nextMetaJson,
                };
              }
            }

            return block;
          }),
        }));

        set({
          scenes: nextScenes,
          links: get().links.filter(
            (link) =>
              link.fromSceneId !== sceneId && link.toSceneId !== sceneId,
          ),
          selectedSceneId: nextSelectedSceneId,
        });

        useAutoSaveStore.getState().markSaved();
        saveProjectLinksSnapshot(targetScene.projectId, get().links);
      },
      createVariable: (projectId) => {
        const trimmedProjectId = projectId.trim();
        if (!trimmedProjectId) {
          return null;
        }

        useAutoSaveStore.getState().markDirty();

        const nextVariable = createEmptyVariable({
          projectId: trimmedProjectId,
          index: get().variables.filter(
            (variable) => variable.projectId === trimmedProjectId,
          ).length,
        });

        set({
          variables: [...get().variables, nextVariable],
          selectedVariableId: nextVariable.id,
        });

        useAutoSaveStore.getState().markSaved();
        saveProjectVariablesSnapshot(trimmedProjectId, get().variables);

        return nextVariable;
      },
      selectVariable: (variableId) => {
        set({ selectedVariableId: variableId });
      },
      deleteVariable: (variableId) => {
        const targetVariable = get().variables.find(
          (variable) => variable.id === variableId,
        );
        if (!targetVariable) {
          return;
        }

        useAutoSaveStore.getState().markDirty();

        const projectVariables = get().variables.filter(
          (variable) => variable.projectId === targetVariable.projectId,
        );
        const deletedIndex = projectVariables.findIndex(
          (variable) => variable.id === variableId,
        );
        const nextSelectedVariableId =
          get().selectedVariableId === variableId
            ? projectVariables[deletedIndex + 1]?.id ?? null
            : get().selectedVariableId;

        const nextVariables = get().variables.filter(
          (variable) => variable.id !== variableId,
        );

        set({
          variables: nextVariables,
          selectedVariableId: nextSelectedVariableId,
          scenes: get().scenes.map((scene) => ({
            ...scene,
            blocks: scene.blocks.map((block) => {
              if (block.blockType === "condition") {
                const nextMetaJson = clearConditionBlockVariableId(
                  block.metaJson,
                  variableId,
                );
                if (nextMetaJson !== block.metaJson) {
                  return {
                    ...block,
                    metaJson: nextMetaJson,
                  };
                }
              }

              if (block.blockType === "choice") {
                const nextMetaJson = clearChoiceBlockEffectVariableId(
                  block.metaJson,
                  variableId,
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
          })),
        });

        useAutoSaveStore.getState().markSaved();
        saveProjectVariablesSnapshot(targetVariable.projectId, nextVariables);
      },
      updateVariable: (variableId, input) => {
        const targetVariable = get().variables.find(
          (variable) => variable.id === variableId,
        );
        if (!targetVariable) {
          return;
        }

        useAutoSaveStore.getState().markDirty();

        const nextVariables = get().variables.map((variable) => {
            if (variable.id !== variableId) {
              return variable;
            }

            const nextVariableType =
              (input.variableType as VariableType | undefined) ??
              variable.variableType;
            const rawDefaultValue = input.defaultValue ?? variable.defaultValue;

            return {
              ...variable,
              ...input,
              variableType: nextVariableType,
              defaultValue:
                nextVariableType === "flag"
                  ? rawDefaultValue > 0
                    ? 1
                    : 0
                  : rawDefaultValue,
            };
          });

        set({
          variables: nextVariables,
        });

        useAutoSaveStore.getState().markSaved();
        saveProjectVariablesSnapshot(targetVariable.projectId, nextVariables);
      },
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
      updateConditionBlock: (sceneId, blockId, input) => {
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
      updateNoteBlock: (sceneId, blockId, input) => {
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
  resetEditor: () => set(initialState),
}));
