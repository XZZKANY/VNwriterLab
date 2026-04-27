import ReactFlow, {
  Background,
  Controls,
  type Edge,
  type Node,
} from "reactflow";
import "reactflow/dist/style.css";

interface SceneGraphCanvasProps {
  nodes: Node[];
  edges: Edge[];
}

export function SceneGraphCanvas({ nodes, edges }: SceneGraphCanvasProps) {
  return (
    <div style={{ height: 480 }}>
      <ReactFlow nodes={nodes} edges={edges} fitView>
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
}
