import ReactFlow, { Background, Controls } from "reactflow";
import "reactflow/dist/style.css";

const nodes = [
  {
    id: "s1",
    position: { x: 0, y: 0 },
    data: { label: "开始场景" },
    type: "default",
  },
  {
    id: "s2",
    position: { x: 220, y: 0 },
    data: { label: "分支场景" },
    type: "default",
  },
];

const edges = [
  { id: "e1-2", source: "s1", target: "s2", label: "继续前进" },
];

export function SceneGraphCanvas() {
  return (
    <div style={{ height: 480 }}>
      <ReactFlow nodes={nodes} edges={edges} fitView>
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
}
