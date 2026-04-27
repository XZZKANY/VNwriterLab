import type { Edge } from "reactflow";

interface GraphEdgeSummaryProps {
  edges: Edge[];
}

export function GraphEdgeSummary({ edges }: GraphEdgeSummaryProps) {
  if (edges.length === 0) {
    return null;
  }

  return (
    <ul aria-label="连线摘要">
      {edges.map((edge) => (
        <li key={edge.id}>{edge.label ? String(edge.label) : "未命名连线"}</li>
      ))}
    </ul>
  );
}
