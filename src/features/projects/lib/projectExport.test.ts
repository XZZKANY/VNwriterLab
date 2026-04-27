import { describe, expect, it } from "vitest";
import {
  buildProjectExportPayload,
  exportProjectAsEngineDraft,
  exportProjectAsJson,
  exportProjectAsPlainText,
} from "./projectExport";

const mockPayload = buildProjectExportPayload({
  project: {
    id: "p1",
    name: "雨夜回响",
    summary: "校园悬疑",
    projectType: "route_based",
    routes: [
      {
        id: "r1",
        projectId: "p1",
        name: "共通线",
        routeType: "common",
        description: "",
        sortOrder: 0,
      },
    ],
    scenes: [],
  },
  scenes: [
    {
      id: "s1",
      projectId: "p1",
      routeId: "r1",
      title: "开场",
      summary: "雨夜",
      sceneType: "normal",
      status: "draft",
      chapterLabel: "",
      sortOrder: 0,
      isStartScene: true,
      isEndingScene: false,
      notes: "",
      blocks: [
        {
          id: "b1",
          sceneId: "s1",
          blockType: "narration",
          sortOrder: 0,
          characterId: null,
          contentText: "雨夜里传来脚步声。",
          metaJson: null,
        },
      ],
    },
  ],
  links: [],
  variables: [],
});

describe("projectExport", () => {
  it("支持导出结构化 JSON", () => {
    const json = exportProjectAsJson(mockPayload);
    expect(json).toContain('"name": "雨夜回响"');
    expect(json).toContain('"title": "开场"');
  });

  it("支持导出纯文本稿", () => {
    const text = exportProjectAsPlainText(mockPayload);
    expect(text).toContain("## 路线：共通线");
    expect(text).toContain("- 场景：开场");
  });

  it("支持导出引擎草稿脚本", () => {
    const script = exportProjectAsEngineDraft(mockPayload);
    expect(script).toContain("label s1:");
    expect(script).toContain('"雨夜里传来脚步声。"');
  });
});
