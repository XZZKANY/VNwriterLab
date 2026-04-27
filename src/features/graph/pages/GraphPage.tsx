import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useEditorStore } from "@/features/editor/store/useEditorStore";
import { useProjectStore } from "@/features/projects/store/useProjectStore";
import { GraphConditionSummary } from "../components/GraphConditionSummary";
import { GraphEdgeSummary } from "../components/GraphEdgeSummary";
import { GraphFilters } from "../components/GraphFilters";
import { GraphIssueSummary } from "../components/GraphIssueSummary";
import { SceneGraphCanvas } from "../components/SceneGraphCanvas";
import { applySceneGraphFilters, buildSceneGraph } from "../lib/graphData";

export function GraphPage() {
  const navigate = useNavigate();
  const scenes = useEditorStore((state) => state.scenes);
  const links = useEditorStore((state) => state.links);
  const variables = useEditorStore((state) => state.variables);
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
  const activeRouteId = routes.some((route) => route.id === selectedRouteId)
    ? selectedRouteId
    : (routes[0]?.id ?? "");
  const rawGraph = useMemo(
    () => buildSceneGraph(scenes, links, variables),
    [scenes, links, variables],
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

  return (
    <section>
      <h2>分支图</h2>
      <div className="layout-split layout-split--wide">
        <GraphFilters
          routes={routes}
          routeFilter={routeFilter}
          selectedRouteId={activeRouteId}
          questionOnly={questionOnly}
          onRouteFilterChange={handleRouteFilterChange}
          onSelectedRouteIdChange={setSelectedRouteId}
          onQuestionOnlyChange={setQuestionOnly}
        />
        <div>
          {graph.nodes.length > 0 ? (
            <>
              <SceneGraphCanvas nodes={graph.nodes} edges={graph.edges} />
              <GraphConditionSummary
                nodes={graph.nodes}
                conditionSummaries={graph.conditionSummaries}
                onOpenScene={handleOpenScene}
              />
              <GraphIssueSummary
                nodes={graph.nodes}
                issueSummaries={graph.issueSummaries}
                onOpenScene={handleOpenScene}
              />
              <GraphEdgeSummary edges={graph.edges} />
            </>
          ) : scenes.length > 0 ? (
            <p>当前筛选条件下没有可显示的场景。</p>
          ) : (
            <p>暂无场景，创建场景并配置跳转后会显示分支图。</p>
          )}
        </div>
      </div>
    </section>
  );
}
