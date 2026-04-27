import { createEmptyVariable } from "@/lib/domain/variable";
import { useAutoSaveStore } from "@/lib/store/useAutoSaveStore";
import { clearChoiceBlockEffectVariableId } from "../choiceBlock";
import { clearConditionBlockVariableId } from "../conditionBlock";
import type {
  EditorSliceCreator,
  EditorVariableSlice,
} from "../editorStore.types";
import { saveProjectVariablesSnapshot } from "./repositorySnapshots";

export const createEditorVariableSlice: EditorSliceCreator<
  EditorVariableSlice
> = (set, get) => ({
  variables: [],
  selectedVariableId: null,
  createVariable(projectId) {
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
  selectVariable(variableId) {
    set({ selectedVariableId: variableId });
  },
  deleteVariable(variableId) {
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
        ? (projectVariables[deletedIndex + 1]?.id ?? null)
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
  updateVariable(variableId, input) {
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

      const nextVariableType = input.variableType ?? variable.variableType;
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
});
