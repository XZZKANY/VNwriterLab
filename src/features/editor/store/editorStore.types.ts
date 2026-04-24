import type { SceneBlock } from "../../../lib/domain/block";
import type { SceneLink } from "../../../lib/domain/link";
import type { Scene } from "../../../lib/domain/scene";
import type { ProjectVariable } from "../../../lib/domain/variable";
import type { StateCreator } from "zustand";
import type { ConditionBlockMeta } from "./conditionBlock";
import type { NoteBlockMeta } from "./noteBlock";

export type EditorSceneUpdateInput = Partial<
  Pick<
    Scene,
    | "title"
    | "summary"
    | "sceneType"
    | "status"
    | "isStartScene"
    | "isEndingScene"
  >
>;

export type EditorVariableUpdateInput = Partial<
  Pick<ProjectVariable, "name" | "variableType" | "defaultValue">
>;

export interface EditorHydrationSlice {
  scenes: Scene[];
  selectedSceneId: string | null;
  links: SceneLink[];
  variables: ProjectVariable[];
  selectedVariableId: string | null;
  hydrateScenes: (projectId: string) => Promise<void>;
  hydrateVariables: (projectId: string) => Promise<void>;
  resetEditor: () => void;
}

export interface EditorSceneSlice {
  createScene: (input?: { projectId?: string; routeId?: string }) => void;
  importScene: (scene: Scene) => void;
  selectScene: (sceneId: string) => void;
  updateScene: (sceneId: string, input: EditorSceneUpdateInput) => void;
  deleteScene: (sceneId: string) => void;
}

export interface EditorVariableSlice {
  createVariable: (projectId: string) => ProjectVariable | null;
  selectVariable: (variableId: string) => void;
  deleteVariable: (variableId: string) => void;
  updateVariable: (
    variableId: string,
    input: EditorVariableUpdateInput,
  ) => void;
}

export interface EditorBlockSlice {
  addBlock: (blockType: SceneBlock["blockType"]) => void;
  deleteBlock: (sceneId: string, blockId: string) => void;
  moveBlockUp: (sceneId: string, blockId: string) => void;
  moveBlockDown: (sceneId: string, blockId: string) => void;
  updateBlockContent: (
    sceneId: string,
    blockId: string,
    contentText: string,
  ) => void;
  updateConditionBlock: (
    sceneId: string,
    blockId: string,
    input: ConditionBlockMeta,
  ) => void;
  updateNoteBlock: (sceneId: string, blockId: string, input: NoteBlockMeta) => void;
}

export interface EditorChoiceLinkSlice {
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
}

export type EditorStoreState = EditorHydrationSlice &
  EditorSceneSlice &
  EditorVariableSlice &
  EditorBlockSlice &
  EditorChoiceLinkSlice;

export type EditorSliceCreator<TSlice> = StateCreator<
  EditorStoreState,
  [],
  [],
  TSlice
>;
