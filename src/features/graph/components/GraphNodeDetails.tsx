import type { SceneGraphData } from "../lib/graphData";

interface GraphNodeDetailsProps {
  selectedNode: SceneGraphData["nodes"][number] | null;
  totalScenes: number;
  totalEdges: number;
  totalIssues: number;
  onOpenScene: (sceneId: string) => void;
}

export function GraphNodeDetails({
  selectedNode,
  totalScenes,
  totalEdges,
  totalIssues,
  onOpenScene,
}: GraphNodeDetailsProps) {
  return (
    <div className="graph-page__details">
      <ul className="graph-page__details-stats">
        <li>当前节点数：{totalScenes}</li>
        <li>当前连线数：{totalEdges}</li>
        <li>问题节点数：{totalIssues}</li>
      </ul>
      {selectedNode ? (
        <div>
          <h4>{selectedNode.data?.label ?? "未命名场景"}</h4>
          {selectedNode.data?.isStartScene ? <p>类型：起始场景</p> : null}
          {selectedNode.data?.isEndingScene ? <p>类型：结局场景</p> : null}
          <button type="button" onClick={() => onOpenScene(selectedNode.id)}>
            返回编辑：{selectedNode.data?.label ?? "未命名场景"}
          </button>
        </div>
      ) : (
        <p>从摘要里选中节点后，在这里查看详情与快捷动作。</p>
      )}
    </div>
  );
}
