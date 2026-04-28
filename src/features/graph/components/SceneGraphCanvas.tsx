import { useMemo } from "react";
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  type Edge,
  type Node,
  type NodeMouseHandler,
} from "reactflow";
import "reactflow/dist/style.css";
import { SceneNode } from "./SceneNode";

interface SceneGraphCanvasProps {
  nodes: Node[];
  edges: Edge[];
  onSelectNode?: (sceneId: string) => void;
}

export function SceneGraphCanvas({
  nodes,
  edges,
  onSelectNode,
}: SceneGraphCanvasProps) {
  // nodeTypes 必须稳定引用，否则 reactflow 会反复重建节点。
  const nodeTypes = useMemo(() => ({ scene: SceneNode }), []);

  const handleNodeClick: NodeMouseHandler = (_event, node) => {
    onSelectNode?.(node.id);
  };

  return (
    <div className="scene-graph-canvas">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodeClick={handleNodeClick}
        fitView
        defaultEdgeOptions={{
          type: "default",
          style: { stroke: "#7a7873", strokeWidth: 1.6 },
        }}
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={18}
          size={1.4}
          color="#3a3937"
        />
        <Controls
          showInteractive={false}
          className="scene-graph-canvas__controls"
        />
        <MiniMap
          pannable
          zoomable
          maskColor="rgba(20, 19, 17, 0.7)"
          nodeColor={(node) => {
            const sceneType = (node.data as { sceneType?: string } | undefined)
              ?.sceneType;
            if (sceneType === "branch") return "#cc7f5a";
            if (sceneType === "ending") return "#7a4a8e";
            return "#506b80";
          }}
          nodeStrokeWidth={2}
          className="scene-graph-canvas__minimap"
        />
      </ReactFlow>
    </div>
  );
}
