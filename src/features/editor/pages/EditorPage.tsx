import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useShallow } from "zustand/react/shallow";
import { AutoSaveStatus } from "@/app/components/AutoSaveStatus";
import { WorkspacePageHeader } from "@/app/components/workspace/WorkspacePageHeader";
import { WorkspacePanel } from "@/app/components/workspace/WorkspacePanel";
import { useProjectStore } from "@/features/projects/store/useProjectStore";
import { BlockToolbar } from "../components/BlockToolbar";
import { EditorSceneInspector } from "../components/EditorSceneInspector";
import { EditorVariablePanel } from "../components/EditorVariablePanel";
import { SceneBlockList } from "../components/SceneBlockList";
import { SceneTree } from "../components/SceneTree";
import { buildEditorWorkspace } from "../lib/editorWorkspace";
import type { EditorSceneUpdateInput } from "../store/editorStore.types";
import { useEditorStore } from "../store/useEditorStore";

export function EditorPage() {
  const navigate = useNavigate();

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

  const workspace = buildEditorWorkspace({
    currentProject,
    scenes,
    variables,
    selectedSceneId,
    selectedVariableId,
  });

  useEffect(() => {
    if (currentProject && workspace.projectVariables.length === 0) {
      void editorActions.hydrateVariables(currentProject.id);
    }
  }, [currentProject, workspace.projectVariables.length, editorActions]);

  useEffect(() => {
    if (currentProject && workspace.visibleScenes.length === 0) {
      void editorActions.hydrateScenes(currentProject.id);
    }
  }, [currentProject, workspace.visibleScenes.length, editorActions]);

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
    <section className="editor-page">
      <WorkspacePageHeader
        title="剧情编辑"
        description="左侧切换场景，中间专注正文，右侧处理场景与变量配置。"
        primaryAction={
          currentProject?.routes[0]
            ? {
                label: "新建场景",
                onClick: () => handleCreateScene(currentProject.routes[0]!.id),
              }
            : undefined
        }
        secondaryActions={[
          { label: "打开分支图", onClick: () => navigate("/graph") },
          { label: "返回项目首页", onClick: () => navigate("/") },
        ]}
      />
      <AutoSaveStatus />
      <div className="editor-page__layout">
        <WorkspacePanel title="场景结构" ariaLabel="场景结构">
          <SceneTree
            routes={currentProject?.routes}
            scenes={workspace.visibleScenes}
            selectedSceneId={selectedSceneId}
            onCreateScene={handleCreateScene}
            onSelectScene={editorActions.selectScene}
          />
        </WorkspacePanel>
        <WorkspacePanel title="场景内容" ariaLabel="场景内容">
          {workspace.selectedScene ? (
            <EditorSceneInspector
              scene={workspace.selectedScene}
              onSceneUpdate={(input) =>
                handleSceneUpdate(workspace.selectedScene!.id, input)
              }
            />
          ) : null}
          <BlockToolbar onAddBlock={editorActions.addBlock} />
          {workspace.selectedScene ? (
            <SceneBlockList
              sceneId={workspace.selectedScene.id}
              blocks={workspace.selectedScene.blocks}
              scenes={workspace.visibleScenes}
              variables={workspace.projectVariables}
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
        </WorkspacePanel>
        <WorkspacePanel title="场景设置" ariaLabel="场景设置">
          {currentProject ? (
            <EditorVariablePanel
              projectId={currentProject.id}
              variables={workspace.projectVariables}
              selectedVariable={workspace.selectedVariable}
              onCreateVariable={() =>
                editorActions.createVariable(currentProject.id)
              }
              onSelectVariable={editorActions.selectVariable}
              onUpdateVariable={editorActions.updateVariable}
              onDeleteVariable={editorActions.deleteVariable}
            />
          ) : (
            <p>先创建项目，再配置变量。</p>
          )}
        </WorkspacePanel>
      </div>
    </section>
  );
}
