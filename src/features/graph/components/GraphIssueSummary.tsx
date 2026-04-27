import type { Node } from "reactflow";
import type {
  SceneGraphIssueSummary,
  SceneGraphNodeData,
} from "../lib/graphData";

interface GraphIssueSummaryProps {
  nodes: Node<SceneGraphNodeData>[];
  issueSummaries: SceneGraphIssueSummary[];
  onOpenScene: (sceneId: string) => void;
}

export function GraphIssueSummary({
  nodes,
  issueSummaries,
  onOpenScene,
}: GraphIssueSummaryProps) {
  return (
    <section aria-label="问题明细">
      <h3>问题明细</h3>
      <ul>
        {nodes.map((node) => {
          const nodeIssues = issueSummaries.find(
            (summary) => summary.sceneId === node.id,
          );

          return (
            <li key={node.id}>
              <strong>{node.data.label}</strong>
              <button type="button" onClick={() => onOpenScene(node.id)}>
                返回编辑：{node.data.label}
              </button>
              {nodeIssues?.issues.length ? (
                <>
                  <p>问题分类：{nodeIssues.categories.join("、")}</p>
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
  );
}
