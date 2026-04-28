import { WorkspacePanel } from "@/app/components/workspace/WorkspacePanel";
import type { Project, Route } from "@/lib/domain/project";
import type { Scene } from "@/lib/domain/scene";
import type {
  RouteSummary,
  SummaryCard,
  TodoItem,
} from "../lib/projectWorkbench";
import { RecentSceneCard } from "./RecentSceneCard";

interface ProjectWorkbenchHeroProps {
  project: Project;
  recentScene: Scene | null;
  recentRoute: Route | null;
  summaryCards: SummaryCard[];
  todoItems: TodoItem[];
  routeSummaries: RouteSummary[];
  onContinueWriting: () => void;
  onOpenGraph: () => void;
  onStartPreview: () => void;
}

export function ProjectWorkbenchHero({
  project,
  recentScene,
  recentRoute,
  summaryCards,
  todoItems,
  routeSummaries,
  onContinueWriting,
  onOpenGraph,
  onStartPreview,
}: ProjectWorkbenchHeroProps) {
  return (
    <div className="project-home__hero">
      <WorkspacePanel
        title={project.name}
        description={project.summary || "项目暂无简介。"}
        ariaLabel="项目总览"
      >
        <ul className="project-home__summary-cards">
          {summaryCards.map((card) => (
            <li key={card.label} className="project-home__summary-card">
              <span className="project-home__summary-label">{card.label}</span>
              <span className="project-home__summary-value">{card.value}</span>
            </li>
          ))}
        </ul>
      </WorkspacePanel>

      <RecentSceneCard
        scene={recentScene}
        route={recentRoute}
        onContinueWriting={onContinueWriting}
        onOpenGraph={onOpenGraph}
        onStartPreview={onStartPreview}
      />

      <WorkspacePanel title="待处理事项" ariaLabel="待处理事项">
        <ul className="project-home__todo-list">
          {todoItems.map((item) => (
            <li key={item.label}>
              {item.label}：{item.value}
            </li>
          ))}
        </ul>
      </WorkspacePanel>

      <WorkspacePanel title="项目结构概览" ariaLabel="项目结构概览">
        {routeSummaries.length === 0 ? (
          <p>暂无路线，先去新增第一条路线。</p>
        ) : (
          <ul className="project-home__route-summary">
            {routeSummaries.map((route) => (
              <li key={route.routeId}>
                {route.routeName}：{route.sceneCount} 个场景
              </li>
            ))}
          </ul>
        )}
      </WorkspacePanel>
    </div>
  );
}
