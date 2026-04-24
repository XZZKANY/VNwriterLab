import { describe, expect, it } from "vitest";
import { createEditorBlockSlice } from "./slices/editorBlockSlice";
import { createEditorChoiceLinkSlice } from "./slices/editorChoiceLinkSlice";
import { createEditorHydrationSlice } from "./slices/editorHydrationSlice";
import { createEditorSceneSlice } from "./slices/editorSceneSlice";
import { createEditorVariableSlice } from "./slices/editorVariableSlice";

const editorSliceFactories = [
  createEditorHydrationSlice,
  createEditorSceneSlice,
  createEditorVariableSlice,
  createEditorBlockSlice,
  createEditorChoiceLinkSlice,
] as const;

describe("useEditorStore slice composition", () => {
  it("导出 5 个 editor slice 工厂且均为函数", () => {
    expect(editorSliceFactories).toHaveLength(5);

    for (const sliceFactory of editorSliceFactories) {
      expect(typeof sliceFactory).toBe("function");
    }
  });
});
