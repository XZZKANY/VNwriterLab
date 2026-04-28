import { beforeEach, describe, expect, it } from "vitest";
import { AUTO_SAVE_STORAGE_KEY, useAutoSaveStore } from "./useAutoSaveStore";

describe("useAutoSaveStore", () => {
  beforeEach(() => {
    localStorage.clear();
    useAutoSaveStore.getState().reset();
  });

  it("初始状态：未脏 / 无保存时间戳 / 未水合 / 未恢复草稿", () => {
    const state = useAutoSaveStore.getState();
    expect(state.hasPendingChanges).toBe(false);
    expect(state.lastSavedAt).toBeNull();
    expect(state.hasHydrated).toBe(false);
    expect(state.hasRestoredDraft).toBe(false);
  });

  it("markDirty 后 hasPendingChanges 为 true", () => {
    useAutoSaveStore.getState().markDirty();
    expect(useAutoSaveStore.getState().hasPendingChanges).toBe(true);
  });

  it("markSaved 不带参时用当前时间，并清掉脏标记", () => {
    useAutoSaveStore.getState().markDirty();
    const before = Date.now();
    useAutoSaveStore.getState().markSaved();
    const after = Date.now();

    const state = useAutoSaveStore.getState();
    expect(state.hasPendingChanges).toBe(false);
    expect(state.lastSavedAt).not.toBeNull();
    const savedTime = new Date(state.lastSavedAt!).getTime();
    expect(savedTime).toBeGreaterThanOrEqual(before);
    expect(savedTime).toBeLessThanOrEqual(after);
  });

  it("markSaved 带显式时间戳时使用传入值", () => {
    useAutoSaveStore.getState().markSaved("2026-01-01T00:00:00.000Z");
    expect(useAutoSaveStore.getState().lastSavedAt).toBe(
      "2026-01-01T00:00:00.000Z",
    );
  });

  it("markHydrated 不带参时仅置 hasHydrated=true，不动 hasRestoredDraft", () => {
    useAutoSaveStore.getState().markHydrated();
    const state = useAutoSaveStore.getState();
    expect(state.hasHydrated).toBe(true);
    expect(state.hasRestoredDraft).toBe(false);
  });

  it("markHydrated(true) 同时把 hasRestoredDraft 标为 true", () => {
    useAutoSaveStore.getState().markHydrated(true);
    expect(useAutoSaveStore.getState().hasRestoredDraft).toBe(true);
  });

  it("hasRestoredDraft 一旦为 true 就不会被随后的 markHydrated(false) 拉回去", () => {
    useAutoSaveStore.getState().markHydrated(true);
    useAutoSaveStore.getState().markHydrated(false);
    expect(useAutoSaveStore.getState().hasRestoredDraft).toBe(true);
  });

  it("reset 把所有状态拉回初始（除非 zustand persist 中间件没回写）", () => {
    useAutoSaveStore.getState().markDirty();
    useAutoSaveStore.getState().markSaved("2026-01-01T00:00:00.000Z");
    useAutoSaveStore.getState().markHydrated(true);

    useAutoSaveStore.getState().reset();

    const state = useAutoSaveStore.getState();
    expect(state.hasPendingChanges).toBe(false);
    expect(state.lastSavedAt).toBeNull();
    expect(state.hasHydrated).toBe(false);
    expect(state.hasRestoredDraft).toBe(false);
  });

  it("AUTO_SAVE_STORAGE_KEY 与 zustand persist 实际使用的 localStorage key 一致", () => {
    useAutoSaveStore.getState().markSaved("2026-04-27T00:00:00.000Z");

    const raw = localStorage.getItem(AUTO_SAVE_STORAGE_KEY);
    expect(raw).not.toBeNull();
  });

  it("persist 只持久化 lastSavedAt（partialize 限制）", () => {
    useAutoSaveStore.getState().markDirty();
    useAutoSaveStore.getState().markSaved("2026-04-27T00:00:00.000Z");
    useAutoSaveStore.getState().markHydrated(true);

    const raw = localStorage.getItem(AUTO_SAVE_STORAGE_KEY);
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw!);
    expect(parsed.state).toEqual({ lastSavedAt: "2026-04-27T00:00:00.000Z" });
    expect(parsed.state.hasPendingChanges).toBeUndefined();
    expect(parsed.state.hasRestoredDraft).toBeUndefined();
  });
});
