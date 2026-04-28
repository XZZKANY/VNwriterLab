import { memo } from "react";
import { Handle, Position, type NodeProps } from "reactflow";
import type { SceneGraphNodeData } from "../lib/graphData";

/**
 * UE 蓝图风格场景节点：
 * - header 颜色按 sceneType（normal / branch / ending）区分
 * - 左侧 input pin（target）、右侧 output pin（source）
 * - body 显示路线 + 状态 + 块/连线统计 + 起始/结局/异常 角标
 */
export const SceneNode = memo(function SceneNode({
  data,
  selected,
}: NodeProps<SceneGraphNodeData>) {
  const sceneType = data.sceneType ?? "normal";
  const headerClass = `scene-node__header scene-node__header--${sceneType}`;
  const className = selected ? "scene-node is-selected" : "scene-node";

  return (
    <div className={className}>
      <Handle
        type="target"
        position={Position.Left}
        className="scene-node__pin scene-node__pin--in"
      />
      <header className={headerClass}>
        <span className="scene-node__title" title={data.label}>
          {data.label || "未命名场景"}
        </span>
        {data.hasIssue ? (
          <span
            className="scene-node__issue-dot"
            aria-label="存在结构问题"
            title="存在结构问题"
          />
        ) : null}
      </header>
      <div className="scene-node__pin-row">
        <span className="scene-node__pin-label">in</span>
        <span className="scene-node__pin-label scene-node__pin-label--out">
          out
        </span>
      </div>
      <div className="scene-node__body">
        <div className="scene-node__meta">
          <span className="scene-node__meta-route">
            {data.routeName ?? "未分配路线"}
          </span>
          <span className="scene-node__meta-status">
            {data.statusLabel ?? "草稿"}
          </span>
        </div>
        <div className="scene-node__counts">
          <span>块 {data.blockCount ?? 0}</span>
          <span>
            ↘ {data.incomingCount ?? 0} · {data.outgoingCount ?? 0} ↗
          </span>
        </div>
        {(data.isStartScene || data.isEndingScene) && (
          <div className="scene-node__tags">
            {data.isStartScene ? (
              <span className="scene-node__tag scene-node__tag--start">
                起始
              </span>
            ) : null}
            {data.isEndingScene ? (
              <span className="scene-node__tag scene-node__tag--ending">
                结局
              </span>
            ) : null}
          </div>
        )}
      </div>
      <Handle
        type="source"
        position={Position.Right}
        className="scene-node__pin scene-node__pin--out"
      />
    </div>
  );
});
