import { getReferenceRepository } from "@/lib/repositories/referenceRepositoryRuntime";
import { getStoryRepository } from "@/lib/repositories/storyRepositoryRuntime";
import { useAutoSaveStore } from "@/lib/store/useAutoSaveStore";
import type {
  EditorHydrationSlice,
  EditorSliceCreator,
  EditorStoreState,
} from "../editorStore.types";

const resettableEditorState: Pick<
  EditorStoreState,
  "scenes" | "selectedSceneId" | "links" | "variables" | "selectedVariableId"
> = {
  scenes: [],
  selectedSceneId: null,
  links: [],
  variables: [],
  selectedVariableId: null,
};

export const createEditorHydrationSlice: EditorSliceCreator<
  EditorHydrationSlice
> = (set, get) => ({
  async hydrateScenes(projectId) {
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
        : (projectScenes[0]?.id ?? null);

    set({
      scenes: [...otherScenes, ...projectScenes],
      links: [...otherLinks, ...projectLinks],
      selectedSceneId: nextSelectedSceneId,
    });

    useAutoSaveStore.getState().markHydrated(projectScenes.length > 0);
  },
  async hydrateVariables(projectId) {
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
        : (projectVariables[0]?.id ?? null);

    set({
      variables: [...otherVariables, ...projectVariables],
      selectedVariableId: nextSelectedVariableId,
    });

    useAutoSaveStore.getState().markHydrated(projectVariables.length > 0);
  },
  resetEditor() {
    set(resettableEditorState);
  },
});
