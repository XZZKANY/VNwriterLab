import { useAutoSaveStore } from "./useAutoSaveStore";

/**
 * 把"标脏 → 执行业务变更 → 标已存"的样板封装成统一调用。
 * 用于各 store slice 中需要触发自动保存提示的同步动作。
 */
export function withAutosave<TArgs extends unknown[], TResult>(
  action: (...args: TArgs) => TResult,
): (...args: TArgs) => TResult {
  return (...args) => {
    const store = useAutoSaveStore.getState();
    store.markDirty();
    const result = action(...args);
    store.markSaved();
    return result;
  };
}
