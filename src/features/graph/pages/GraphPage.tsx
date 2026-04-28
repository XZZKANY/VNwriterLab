import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { WorkspacePageHeader } from "@/app/components/workspace/WorkspacePageHeader";
import { useEditorStore } from "@/features/editor/store/useEditorStore";
import { useProjectStore } from "@/features/projects/store/useProjectStore";
import { GraphConditionSummary } from "../components/GraphConditionSummary";
import { GraphEdgeSummary } from "../components/GraphEdgeSummary";
import { GraphFilters } from "../components/GraphFilters";
import { GraphIssueSummary } from "../components/GraphIssueSummary";
import { GraphNodeDetails } from "../components/GraphNodeDetails";
import { SceneGraphCanvas } from "../components/SceneGraphCanvas";
import { applySceneGraphFilters, buildSceneGraph } from "../lib/graphData";

type DrawerTab = "condition" | "issue" | "edge";

export function GraphPage() {
  const navigate = useNavigate();
  const scenes = useEditorStore((state) => state.scenes);
  const links = useEditorStore((state) => state.links);
  const variables = useEditorStore((state) => state.variables);
  const selectedSceneId = useEditorStore((state) => state.selectedSceneId);
  const selectScene = useEditorStore((state) => state.selectScene);
  const currentProject = useProjectStore((state) => state.currentProject);
  const routes = useMemo(
    () =>
      [...(currentProject?.routes ?? [])].sort((left, right) => {
        if (left.sortOrder === right.sortOrder) {
          return left.id.localeCompare(right.id);
        }

        return left.sortOrder - right.sortOrder;
      }),
    [currentProject?.routes],
  );
  const [routeFilter, setRouteFilter] = useState<"all" | "single">("all");
  const [selectedRouteId, setSelectedRouteId] = useState("");
  const [questionOnly, setQuestionOnly] = useState(false);
  const [drawerTab, setDrawerTab] = useState<DrawerTab | null>("condition");
  const activeRouteId = routes.some((route) => route.id === selectedRouteId)
    ? selectedRouteId
    : (routes[0]?.id ?? "");
  const rawGraph = useMemo(
    () => buildSceneGraph(scenes, links, variables, routes),
    [scenes, links, variables, routes],
  );
  const graph = useMemo(
    () =>
      applySceneGraphFilters(rawGraph, {
        routeFilter,
        routeId: activeRouteId || null,
        questionOnly,
      }),
    [rawGraph, routeFilter, activeRouteId, questionOnly],
  );

  const selectedNode =
    graph.nodes.find((node) => node.id === selectedSceneId) ?? null;

  function handleOpenScene(sceneId: string) {
    selectScene(sceneId);
    navigate("/editor");
  }

  function handleRouteFilterChange(nextRouteFilter: "all" | "single") {
    setRouteFilter(nextRouteFilter);

    if (nextRouteFilter === "single") {
      setSelectedRouteId((currentRouteId) =>
        routes.some((route) => route.id === currentRouteId)
          ? currentRouteId
          : (routes[0]?.id ?? ""),
      );
    }
  }

  function toggleDrawer(tab: DrawerTab) {
    setDrawerTab((current) => (current === tab ? null : tab));
  }

  return (
    <section className="graph-page">
      <WorkspacePageHeader
        title="分支图"
        description="筛选结构问题、查看节点详情，并快速返回编辑修正。"
        primaryAction={{
          label: "继续写作",
          onClick: () => navigate("/editor"),
        }}
      />
      <div className="graph-page__stage">
        {graph.nodes.length > 0 ? (
          <SceneGraphCanvas
            nodes={graph.nodes}
            edges={graph.edges}
            onSelectNode={selectScene}
          />
        ) : (
          <div className="graph-page__empty">
            {scenes.length > 0
              ? "当前筛选条件下没有可显示的场景。"
              : "暂无场景，创建场景并配置跳转后会显示分支图。"}
          </div>
        )}

        <section
          className="graph-page__floating graph-page__floating--toolbar"
          aria-label="图谱筛选"
        >
          <GraphFilters
            routes={routes}
            routeFilter={routeFilter}
            selectedRouteId={activeRouteId}
            questionOnly={questionOnly}
            onRouteFilterChange={handleRouteFilterChange}
            onSelectedRouteIdChange={setSelectedRouteId}
            onQuestionOnlyChange={setQuestionOnly}
          />
        </section>

        <section
          className="graph-page__floating graph-page__floating--inspector"
          aria-label="图谱详情"
        >
          <GraphNodeDetails
            selectedNode={selectedNode}
            totalScenes={graph.nodes.length}
            totalEdges={graph.edges.length}
            totalIssues={graph.issueSummaries.length}
            onOpenScene={handleOpenScene}
          />
        </section>

        <div className="graph-page__drawer" data-open={drawerTab !== null}>
          <div className="graph-page__drawer-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={drawerTab === "condition"}
              className={
                drawerTab === "condition"
                  ? "graph-page__drawer-tab is-active"
                  : "graph-page__drawer-tab"
              }
              onClick={() => toggleDrawer("condition")}
            >
              条件摘要（{graph.conditionSummaries.length}）
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={drawerTab === "issue"}
              className={
                drawerTab === "issue"
                  ? "graph-page__drawer-tab is-active"
                  : "graph-page__drawer-tab"
              }
              onClick={() => toggleDrawer("issue")}
            >
              问题明细（{graph.issueSummaries.length}）
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={drawerTab === "edge"}
              className={
                drawerTab === "edge"
                  ? "graph-page__drawer-tab is-active"
                  : "graph-page__drawer-tab"
              }
              onClick={() => toggleDrawer("edge")}
            >
              连线明细（{graph.edges.length}）
            </button>
          </div>
          {drawerTab !== null ? (
            <div className="graph-page__drawer-body">
              {drawerTab === "condition" ? (
                <GraphConditionSummary
                  nodes={graph.nodes}
                  conditionSummaries={graph.conditionSummaries}
                  onOpenScene={handleOpenScene}
                />
              ) : null}
              {drawerTab === "issue" ? (
                <GraphIssueSummary
                  nodes={graph.nodes}
                  issueSummaries={graph.issueSummaries}
                  onOpenScene={handleOpenScene}
                />
              ) : null}
              {drawerTab === "edge" ? (
                <GraphEdgeSummary edges={graph.edges} />
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
