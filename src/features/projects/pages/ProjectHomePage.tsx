import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AutoSaveStatus } from "@/app/components/AutoSaveStatus";
import { WorkspacePageHeader } from "@/app/components/workspace/WorkspacePageHeader";
import { WorkspacePanel } from "@/app/components/workspace/WorkspacePanel";
import { useCharacterStore } from "@/features/characters/store/useCharacterStore";
import { useEditorStore } from "@/features/editor/store/useEditorStore";
import { useLoreStore } from "@/features/lore/store/useLoreStore";
import { ImportPanel } from "../components/ImportPanel";
import { ProjectCreateForm } from "../components/ProjectCreateForm";
import { ProjectWorkbenchHero } from "../components/ProjectWorkbenchHero";
import { ProjectWorkbenchSidebar } from "../components/ProjectWorkbenchSidebar";
import { buildProjectWorkbench } from "../lib/projectWorkbench";
import { useProjectStore } from "../store/useProjectStore";

export function ProjectHomePage() {
  const navigate = useNavigate();
  const currentProject = useProjectStore((state) => state.currentProject);
  const hydrateLatestProject = useProjectStore(
    (state) => state.hydrateLatestProject,
  );
  const createProject = useProjectStore((state) => state.createProject);
  const importProject = useProjectStore((state) => state.importProject);
  const createRoute = useProjectStore((state) => state.createRoute);
  const renameRoute = useProjectStore((state) => state.renameRoute);
  const editorScenes = useEditorStore((state) => state.scenes);
  const selectedSceneId = useEditorStore((state) => state.selectedSceneId);
  const selectScene = useEditorStore((state) => state.selectScene);
  const links = useEditorStore((state) => state.links);
  const variables = useEditorStore((state) => state.variables);
  const characters = useCharacterStore((state) => state.characters);
  const loreEntries = useLoreStore((state) => state.entries);

  useEffect(() => {
    if (!currentProject) {
      void hydrateLatestProject();
    }
  }, [currentProject, hydrateLatestProject]);

  if (!currentProject) {
    return (
      <section className="project-home">
        <WorkspacePageHeader
          title="项目工作台"
          description="先创建或导入项目，再进入工作台。"
        />
        <AutoSaveStatus />
        <WorkspacePanel title="创建项目" ariaLabel="创建项目">
          <ProjectCreateForm onSubmit={createProject} />
        </WorkspacePanel>
        <ImportPanel onImport={importProject} />
      </section>
    );
  }

  const workbench = buildProjectWorkbench({
    project: currentProject,
    editorScenes,
    links,
    variables,
    characters,
    loreEntries,
    selectedSceneId,
  });

  const sortedRoutes = [...currentProject.routes].sort((left, right) => {
    if (left.sortOrder !== right.sortOrder) {
      return left.sortOrder - right.sortOrder;
    }

    return left.id.localeCompare(right.id);
  });

  const sceneCountByRoute = new Map(
    workbench.routeSummaries.map(
      (summary) => [summary.routeId, summary.sceneCount] as const,
    ),
  );

  const projectLinks = links.filter(
    (link) => link.projectId === currentProject.id,
  );
  const projectVariables = variables.filter(
    (variable) => variable.projectId === currentProject.id,
  );

  function handleContinueWriting() {
    if (!workbench.recentScene) {
      return;
    }

    selectScene(workbench.recentScene.id);
    navigate("/editor");
  }

  function handleOpenGraph() {
    if (workbench.recentScene) {
      selectScene(workbench.recentScene.id);
    }

    navigate("/graph");
  }

  function handleStartPreview() {
    const scene = workbench.startScene ?? workbench.recentScene;
    if (scene) {
      selectScene(scene.id);
    }

    navigate("/preview");
  }

  return (
    <section className="project-home">
      <WorkspacePageHeader
        title="项目工作台"
        description="先看项目概况，再决定继续写作、检查结构还是导出内容。"
      />
      <AutoSaveStatus />
      <p className="project-home__default-route">
        默认路线：{sortedRoutes[0]?.name ?? "未配置"}
      </p>
      <div className="project-home__layout">
        <ProjectWorkbenchHero
          project={currentProject}
          recentScene={workbench.recentScene}
          recentRoute={workbench.recentRoute}
          summaryCards={workbench.summaryCards}
          todoItems={workbench.todoItems}
          routeSummaries={workbench.routeSummaries}
          onContinueWriting={handleContinueWriting}
          onOpenGraph={handleOpenGraph}
          onStartPreview={handleStartPreview}
        />
        <ProjectWorkbenchSidebar
          project={currentProject}
          stats={workbench.stats}
          routes={sortedRoutes}
          sceneCountByRoute={sceneCountByRoute}
          availableScenes={workbench.mergedScenes}
          projectLinks={projectLinks}
          projectVariables={projectVariables}
          editorScenes={editorScenes}
          characters={characters}
          loreEntries={loreEntries}
          onCreateRoute={createRoute}
          onRenameRoute={renameRoute}
          onImport={importProject}
        />
      </div>
    </section>
  );
}
