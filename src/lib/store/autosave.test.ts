import { describe, expect, it, beforeEach } from "vitest";
import { withAutosave } from "./autosave";
import { useAutoSaveStore } from "./useAutoSaveStore";

describe("withAutosave", () => {
  beforeEach(() => {
    useAutoSaveStore.getState().reset();
  });

  it("先 markDirty 再执行业务函数，最后 markSaved", () => {
    const order: string[] = [];
    const action = withAutosave((value: number) => {
      order.push(`pending:${useAutoSaveStore.getState().hasPendingChanges}`);
      return value + 1;
    });

    expect(useAutoSaveStore.getState().hasPendingChanges).toBe(false);
    const result = action(2);

    expect(result).toBe(3);
    expect(order).toEqual(["pending:true"]);
    expect(useAutoSaveStore.getState().hasPendingChanges).toBe(false);
    expect(useAutoSaveStore.getState().lastSavedAt).not.toBeNull();
  });

  it("当业务函数抛错时 hasPendingChanges 仍为 true（不触发 markSaved）", () => {
    const action = withAutosave(() => {
      throw new Error("boom");
    });

    expect(() => action()).toThrow("boom");
    expect(useAutoSaveStore.getState().hasPendingChanges).toBe(true);
    expect(useAutoSaveStore.getState().lastSavedAt).toBeNull();
  });

  it("透传参数与返回值", () => {
    const action = withAutosave((a: number, b: string) => `${a}:${b}`);
    expect(action(7, "x")).toBe("7:x");
  });
});
