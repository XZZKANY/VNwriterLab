import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AutoSaveStatus } from "@/app/components/AutoSaveStatus";
import type { Scene } from "@/lib/domain/scene";
import { useCharacterStore } from "@/features/characters/store/useCharacterStore";
import { useEditorStore } from "@/features/editor/store/useEditorStore";
import { useLoreStore } from "@/features/lore/store/useLoreStore";
import { ExportPanel } from "../components/ExportPanel";
import { ImportPanel } from "../components/ImportPanel";
import { ProjectCreateForm } from "../components/ProjectCreateForm";
import { ProjectStatsPanel } from "../components/ProjectStatsPanel";
import { RecentSceneCard } from "../components/RecentSceneCard";
import { RouteListPanel } from "../components/RouteListPanel";
import { SearchPanel } from "../components/SearchPanel";
import { buildProjectStats } from "../lib/projectStats";
import { useProjectStore } from "../store/useProjectStore";

function resolveRecentScene(scenes: Scene[], selectedSceneId: string | null) {
  if (selectedSceneId) {
    const selectedScene = scenes.find((scene) => scene.id === selectedSceneId);
    if (selectedScene) {
      return selectedScene;
    }
  }

  return scenes[scenes.length - 1] ?? null;
}

function resolveStartScene(scenes: Scene[]) {
  return scenes.find((scene) => scene.isStartScene) ?? scenes[0] ?? null;
}

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

  const sortedRoutes = [...(currentProject?.routes ?? [])].sort(
    (left, right) => {
      if (left.sortOrder !== right.sortOrder) {
        return left.sortOrder - right.sortOrder;
      }

      return left.id.localeCompare(right.id);
    },
  );

  const sceneCountByRoute = new Map(
    sortedRoutes.map((route) => [
      route.id,
      currentProject?.scenes.filter((scene) => scene.routeId === route.id)
        .length ?? 0,
    ]),
  );

  const projectStats = currentProject
    ? buildProjectStats({
        project: currentProject,
        editorScenes,
        links,
        variables,
        characters,
        loreEntries,
      })
    : null;

  const mergedSceneMap = new Map(
    (currentProject?.scenes ?? []).map((scene) => [scene.id, scene] as const),
  );
  editorScenes
    .filter((scene) => scene.projectId === currentProject?.id)
    .forEach((scene) => {
      mergedSceneMap.set(scene.id, scene);
    });

  const availableScenes = [...mergedSceneMap.values()].sort((left, right) => {
    if (left.sortOrder !== right.sortOrder) {
      return left.sortOrder - right.sortOrder;
    }

    return left.title.localeCompare(right.title, "zh-CN");
  });
  const projectLinks = currentProject
    ? links.filter((link) => link.projectId === currentProject.id)
    : [];
  const projectVariables = currentProject
    ? variables.filter((variable) => variable.projectId === currentProject.id)
    : [];

  const recentScene = resolveRecentScene(availableScenes, selectedSceneId);
  const startScene = resolveStartScene(availableScenes) ?? recentScene;
  const recentRoute =
    sortedRoutes.find((route) => route.id === recentScene?.routeId) ?? null;

  useEffect(() => {
    if (!currentProject) {
      void hydrateLatestProject();
    }
  }, [currentProject, hydrateLatestProject]);

  function handleContinueWriting() {
    if (!recentScene) {
      return;
    }

    selectScene(recentScene.id);
    navigate("/editor");
  }

  function handleOpenGraph() {
    if (recentScene) {
      selectScene(recentScene.id);
    }

    navigate("/graph");
  }

  function handleStartPreview() {
    if (startScene) {
      selectScene(startScene.id);
    }

    navigate("/preview");
  }

  return (
    <section>
      <h2>项目首页</h2>
      <AutoSaveStatus />
      {!currentProject ? (
        <>
          <ProjectCreateForm onSubmit={createProject} />
          <ImportPanel onImport={importProject} />
        </>
      ) : (
        <div>
          <h3>{currentProject.name}</h3>
          <p>{currentProject.summary}</p>
          <p>默认路线：{sortedRoutes[0]?.name}</p>
          {projectStats ? <ProjectStatsPanel stats={projectStats} /> : null}
          <RecentSceneCard
            scene={recentScene}
            route={recentRoute}
            onContinueWriting={handleContinueWriting}
            onOpenGraph={handleOpenGraph}
            onStartPreview={handleStartPreview}
          />
          <RouteListPanel
            routes={sortedRoutes}
            sceneCountByRoute={sceneCountByRoute}
            onCreateRoute={createRoute}
            onRenameRoute={renameRoute}
          />
          <ExportPanel
            project={currentProject}
            scenes={availableScenes}
            links={projectLinks}
            variables={projectVariables}
          />
          <ImportPanel onImport={importProject} />
          <SearchPanel
            project={currentProject}
            editorScenes={editorScenes}
            characters={characters}
            loreEntries={loreEntries}
          />
        </div>
      )}
    </section>
  );
}
