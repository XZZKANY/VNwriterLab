import type { Node } from "reactflow";
import type {
  SceneGraphConditionSummary,
  SceneGraphNodeData,
} from "../lib/graphData";

interface GraphConditionSummaryProps {
  nodes: Node<SceneGraphNodeData>[];
  conditionSummaries: SceneGraphConditionSummary[];
  onOpenScene: (sceneId: string) => void;
}

export function GraphConditionSummary({
  nodes,
  conditionSummaries,
  onOpenScene,
}: GraphConditionSummaryProps) {
  return (
    <section aria-label="条件摘要">
      <h3>条件摘要</h3>
      <ul>
        {nodes.map((node) => {
          const nodeSummaries = conditionSummaries.filter(
            (summary) => summary.sceneId === node.id,
          );

          return (
            <li key={node.id}>
              <strong>{node.data.label}</strong>
              <button type="button" onClick={() => onOpenScene(node.id)}>
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
  );
}
