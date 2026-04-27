import { useEffect } from "react";
import { useShallow } from "zustand/react/shallow";
import { AutoSaveStatus } from "@/app/components/AutoSaveStatus";
import { useProjectStore } from "@/features/projects/store/useProjectStore";
import { BlockToolbar } from "../components/BlockToolbar";
import { SceneBlockList } from "../components/SceneBlockList";
import { SceneMetadataForm } from "../components/SceneMetadataForm";
import { SceneTree } from "../components/SceneTree";
import { VariablePanel } from "../components/VariablePanel";
import type { EditorSceneUpdateInput } from "../store/editorStore.types";
import { useEditorStore } from "../store/useEditorStore";

export function EditorPage() {
  const { scenes, selectedSceneId, variables, selectedVariableId } =
    useEditorStore(
      useShallow((state) => ({
        scenes: state.scenes,
        selectedSceneId: state.selectedSceneId,
        variables: state.variables,
        selectedVariableId: state.selectedVariableId,
      })),
    );

  const editorActions = useEditorStore(
    useShallow((state) => ({
      createScene: state.createScene,
      importScene: state.importScene,
      selectScene: state.selectScene,
      updateLocalScene: state.updateScene,
      hydrateScenes: state.hydrateScenes,
      hydrateVariables: state.hydrateVariables,
      createVariable: state.createVariable,
      selectVariable: state.selectVariable,
      deleteVariable: state.deleteVariable,
      updateVariable: state.updateVariable,
      addBlock: state.addBlock,
      deleteBlock: state.deleteBlock,
      moveBlockUp: state.moveBlockUp,
      moveBlockDown: state.moveBlockDown,
      updateBlockContent: state.updateBlockContent,
      updateChoiceBlock: state.updateChoiceBlock,
      updateConditionBlock: state.updateConditionBlock,
      updateNoteBlock: state.updateNoteBlock,
    })),
  );

  const { currentProject, createProjectSceneInRoute, updateProjectScene } =
    useProjectStore(
      useShallow((state) => ({
        currentProject: state.currentProject,
        createProjectSceneInRoute: state.createSceneInRoute,
        updateProjectScene: state.updateScene,
      })),
    );

  const visibleScenes = currentProject
    ? scenes.filter((scene) => scene.projectId === currentProject.id)
    : scenes;
  const selectedScene =
    visibleScenes.find((scene) => scene.id === selectedSceneId) ?? null;
  const projectVariables = currentProject
    ? variables.filter((variable) => variable.projectId === currentProject.id)
    : [];
  const selectedVariable =
    projectVariables.find((variable) => variable.id === selectedVariableId) ??
    projectVariables[0] ??
    null;

  useEffect(() => {
    if (currentProject && projectVariables.length === 0) {
      void editorActions.hydrateVariables(currentProject.id);
    }
  }, [currentProject, projectVariables.length, editorActions]);

  useEffect(() => {
    if (currentProject && visibleScenes.length === 0) {
      void editorActions.hydrateScenes(currentProject.id);
    }
  }, [currentProject, visibleScenes.length, editorActions]);

  function handleSceneUpdate(sceneId: string, input: EditorSceneUpdateInput) {
    if (currentProject) {
      updateProjectScene(sceneId, input);
    }

    editorActions.updateLocalScene(sceneId, input);
  }

  function handleCreateScene(routeId?: string) {
    if (currentProject && routeId) {
      const nextScene = createProjectSceneInRoute(routeId);
      if (nextScene) {
        editorActions.importScene(nextScene);
        return;
      }
    }

    editorActions.createScene({
      projectId: currentProject?.id,
      routeId,
    });
  }

  return (
    <section>
      <h2>剧情编辑</h2>
      <AutoSaveStatus />
      <div className="layout-split layout-split--default">
        <SceneTree
          routes={currentProject?.routes}
          scenes={visibleScenes}
          selectedSceneId={selectedSceneId}
          onCreateScene={handleCreateScene}
          onSelectScene={editorActions.selectScene}
        />
        <div>
          {currentProject ? (
            <VariablePanel
              projectId={currentProject.id}
              variables={projectVariables}
              selectedVariable={selectedVariable}
              onCreateVariable={() =>
                editorActions.createVariable(currentProject.id)
              }
              onSelectVariable={editorActions.selectVariable}
              onUpdateVariable={editorActions.updateVariable}
              onDeleteVariable={editorActions.deleteVariable}
            />
          ) : null}
          {selectedScene ? (
            <SceneMetadataForm
              scene={selectedScene}
              onUpdate={(input) => handleSceneUpdate(selectedScene.id, input)}
            />
          ) : null}
          <BlockToolbar onAddBlock={editorActions.addBlock} />
          {selectedScene ? (
            <SceneBlockList
              sceneId={selectedScene.id}
              blocks={selectedScene.blocks}
              scenes={visibleScenes}
              variables={projectVariables}
              onDeleteBlock={editorActions.deleteBlock}
              onMoveBlockUp={editorActions.moveBlockUp}
              onMoveBlockDown={editorActions.moveBlockDown}
              onUpdateBlockContent={editorActions.updateBlockContent}
              onUpdateChoiceBlock={editorActions.updateChoiceBlock}
              onUpdateConditionBlock={editorActions.updateConditionBlock}
              onUpdateNoteBlock={editorActions.updateNoteBlock}
            />
          ) : (
            <p>请选择或创建一个场景。</p>
          )}
        </div>
      </div>
    </section>
  );
}
