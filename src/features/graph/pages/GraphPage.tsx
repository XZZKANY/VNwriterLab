import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useEditorStore } from "../../editor/store/useEditorStore";
import { useProjectStore } from "../../projects/store/useProjectStore";
import { GraphFilters } from "../components/GraphFilters";
import { SceneGraphCanvas } from "../components/SceneGraphCanvas";
import { applySceneGraphFilters, buildSceneGraph } from "../lib/graphData";

export function GraphPage() {
  const navigate = useNavigate();
  const scenes = useEditorStore((state) => state.scenes);
  const links = useEditorStore((state) => state.links);
  const variables = useEditorStore((state) => state.variables);
  const selectScene = useEditorStore((state) => state.selectScene);
  const currentProject = useProjectStore((state) => state.currentProject);
  const routes = [...(currentProject?.routes ?? [])].sort((left, right) => {
    if (left.sortOrder === right.sortOrder) {
      return left.id.localeCompare(right.id);
    }

    return left.sortOrder - right.sortOrder;
  });
  const [routeFilter, setRouteFilter] = useState<"all" | "single">("all");
  const [selectedRouteId, setSelectedRouteId] = useState("");
  const [questionOnly, setQuestionOnly] = useState(false);
  const activeRouteId =
    routes.some((route) => route.id === selectedRouteId)
      ? selectedRouteId
      : routes[0]?.id ?? "";
  const graph = applySceneGraphFilters(buildSceneGraph(scenes, links, variables), {
    routeFilter,
    routeId: activeRouteId || null,
    questionOnly,
  });

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
          : routes[0]?.id ?? "",
      );
    }
  }

  return (
    <section>
      <h2>分支图</h2>
      <div
        style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 16 }}
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
        <div>
          {graph.nodes.length > 0 ? (
            <>
              <SceneGraphCanvas nodes={graph.nodes} edges={graph.edges} />
              <section aria-label="条件摘要">
                <h3>条件摘要</h3>
                <ul>
                  {graph.nodes.map((node) => {
                    const nodeSummaries = graph.conditionSummaries.filter(
                      (summary) => summary.sceneId === node.id,
                    );

                    return (
                      <li key={node.id}>
                        <strong>{node.data.label}</strong>
                        <button type="button" onClick={() => handleOpenScene(node.id)}>
                          返回编辑：{node.data.label}
                        </button>
                        {nodeSummaries.length > 0 ? (
                          <ul>
                            {nodeSummaries.map((summary) => (
                              <li key={summary.linkId}>
                                {summary.linkLabel}：{summary.summary}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p>暂无条件摘要。</p>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </section>
              <section aria-label="问题明细">
                <h3>问题明细</h3>
                <ul>
                  {graph.nodes.map((node) => {
                    const nodeIssues = graph.issueSummaries.find(
                      (summary) => summary.sceneId === node.id,
                    );

                    return (
                      <li key={node.id}>
                        <strong>{node.data.label}</strong>
                        <button type="button" onClick={() => handleOpenScene(node.id)}>
                          返回编辑：{node.data.label}
                        </button>
                        {nodeIssues?.issues.length ? (
                          <>
                            <p>
                              问题分类：
                              {nodeIssues.categories.join("、")}
                            </p>
                            <ul>
                              {nodeIssues.issues.map((issue, index) => (
                                <li key={`${node.id}-${index}`}>{issue}</li>
                              ))}
                            </ul>
                          </>
                        ) : (
                          <p>暂无问题明细。</p>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </section>
              {graph.edges.length > 0 ? (
                <ul aria-label="连线摘要">
                  {graph.edges.map((edge) => (
                    <li key={edge.id}>
                      {edge.label ? String(edge.label) : "未命名连线"}
                    </li>
                  ))}
                </ul>
              ) : null}
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
