import { useAutoSaveStore } from "@/lib/store/useAutoSaveStore";

function formatSavedAt(savedAt: string) {
  return new Date(savedAt).toLocaleString("zh-CN", {
    hour12: false,
  });
}

export function AutoSaveStatus() {
  const lastSavedAt = useAutoSaveStore((state) => state.lastSavedAt);
  const hasPendingChanges = useAutoSaveStore(
    (state) => state.hasPendingChanges,
  );
  const hasRestoredDraft = useAutoSaveStore((state) => state.hasRestoredDraft);

  if (hasPendingChanges) {
    return <p role="status">正在保存本地草稿…</p>;
  }

  if (lastSavedAt && hasRestoredDraft) {
    return (
      <p role="status">
        已恢复本地草稿，最近保存于 {formatSavedAt(lastSavedAt)}
      </p>
    );
  }

  if (lastSavedAt) {
    return <p role="status">已自动保存于 {formatSavedAt(lastSavedAt)}</p>;
  }

  return <p role="status">当前内容将在本地自动保存</p>;
}
