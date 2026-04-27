import type { Route } from "@/lib/domain/project";
import type { Scene } from "@/lib/domain/scene";

const SCENE_STATUS_LABELS: Record<Scene["status"], string> = {
  draft: "草稿",
  completed: "已完成",
  needs_revision: "需修改",
  needs_supplement: "待补充",
  needs_logic_check: "待检查逻辑",
};

interface RecentSceneCardProps {
  scene: Scene | null;
  route: Route | null;
  onContinueWriting: () => void;
  onOpenGraph: () => void;
  onStartPreview: () => void;
}

export function RecentSceneCard({
  scene,
  route,
  onContinueWriting,
  onOpenGraph,
  onStartPreview,
}: RecentSceneCardProps) {
  return (
    <section aria-label="最近编辑">
      <h4>最近编辑</h4>
      {scene ? (
        <div>
          <p>
            <strong>{scene.title}</strong>
          </p>
          <p>所属路线：{route?.name ?? "未分配路线"}</p>
          <p>当前状态：{SCENE_STATUS_LABELS[scene.status]}</p>
          <p>{scene.summary.trim() || "当前场景还没有摘要。"}</p>
          <div aria-label="快捷动作">
            <button type="button" onClick={onContinueWriting}>
              继续写作
            </button>
            <button type="button" onClick={onOpenGraph}>
              打开分支图
            </button>
            <button type="button" onClick={onStartPreview}>
              从头预览
            </button>
          </div>
        </div>
      ) : (
        <p>暂无可继续创作的场景。</p>
      )}
    </section>
  );
}
