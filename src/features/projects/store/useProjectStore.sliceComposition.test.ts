import { describe, expect, it } from "vitest";
import { createProjectHydrationSlice } from "./slices/projectHydrationSlice";
import { createProjectLifecycleSlice } from "./slices/projectLifecycleSlice";
import { createProjectRouteSlice } from "./slices/projectRouteSlice";
import { createProjectSceneSlice } from "./slices/projectSceneSlice";

describe("useProjectStore slice composition", () => {
  it("导出 4 个 project slice 工厂", () => {
    expect(typeof createProjectHydrationSlice).toBe("function");
    expect(typeof createProjectLifecycleSlice).toBe("function");
    expect(typeof createProjectRouteSlice).toBe("function");
    expect(typeof createProjectSceneSlice).toBe("function");
  });
});
