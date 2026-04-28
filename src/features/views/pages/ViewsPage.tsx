import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { WorkspacePageHeader } from "@/app/components/workspace/WorkspacePageHeader";
import { WorkspacePanel } from "@/app/components/workspace/WorkspacePanel";
import { useEditorStore } from "@/features/editor/store/useEditorStore";
import { useProjectStore } from "@/features/projects/store/useProjectStore";
import { OutlineView } from "../components/OutlineView";
import { RouteView } from "../components/RouteView";
import { StatusView } from "../components/StatusView";
import { ViewsSummary } from "../components/ViewsSummary";
import {
  buildViewsDashboard,
  type ViewsDashboard,
} from "../lib/viewsDashboard";

type ViewMode = "outline" | "status" | "route";

const TABS: Array<{ id: ViewMode; label: string }> = [
  { id: "outline", label: "大纲" },
  { id: "status", label: "状态" },
  { id: "route", label: "路线" },
];

export function ViewsPage() {
  const navigate = useNavigate();
  const currentProject = useProjectStore((state) => state.currentProject);
  const scenes = useEditorStore((state) => state.scenes);
  const links = useEditorStore((state) => state.links);
  const selectScene = useEditorStore((state) => state.selectScene);
  const [activeView, setActiveView] = useState<ViewMode>("outline");

  if (!currentProject) {
    return (
      <section className="views-page">
        <WorkspacePageHeader
          title="多视图"
          description="从大纲、状态、路线三个角度观察项目结构。"
        />
        <p>请先创建项目。</p>
      </section>
    );
  }

  const projectScenes = scenes.filter(
    (scene) => scene.projectId === currentProject.id,
  );
  const projectLinks = links.filter(
    (link) => link.projectId === currentProject.id,
  );
  const dashboard = buildViewsDashboard({
    routes: currentProject.routes,
    scenes: projectScenes,
    links: projectLinks,
  });

  function openScene(sceneId: string) {
    selectScene(sceneId);
    navigate("/editor");
  }

  return (
    <section className="views-page">
      <WorkspacePageHeader
        title="多视图"
        description="从大纲、状态、路线三个角度观察项目结构。"
        primaryAction={{
          label: "继续写作",
          onClick: () => navigate("/editor"),
        }}
      />
      <div
        className="views-page__switcher"
        role="tablist"
        aria-label="视图切换"
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeView === tab.id}
            className={
              activeView === tab.id
                ? "views-page__tab is-active"
                : "views-page__tab"
            }
            onClick={() => setActiveView(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="views-page__layout">
        <WorkspacePanel title="视图内容" ariaLabel="视图内容">
          <ActiveView
            view={activeView}
            dashboard={dashboard}
            onOpenScene={openScene}
          />
        </WorkspacePanel>
        <WorkspacePanel title="当前摘要" ariaLabel="当前摘要">
          <ViewsSummary view={activeView} dashboard={dashboard} />
        </WorkspacePanel>
      </div>
    </section>
  );
}

interface ActiveViewProps {
  view: ViewMode;
  dashboard: ViewsDashboard;
  onOpenScene: (sceneId: string) => void;
}

function ActiveView({ view, dashboard, onOpenScene }: ActiveViewProps) {
  if (view === "outline") {
    return (
      <OutlineView
        sections={dashboard.outlineSections}
        onOpenScene={onOpenScene}
      />
    );
  }

  if (view === "status") {
    return (
      <StatusView cards={dashboard.statusCards} onOpenScene={onOpenScene} />
    );
  }

  return <RouteView cards={dashboard.routeCards} onOpenScene={onOpenScene} />;
}
