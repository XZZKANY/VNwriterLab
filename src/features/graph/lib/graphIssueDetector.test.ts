import { describe, expect, it } from "vitest";
import type { Scene } from "@/lib/domain/scene";
import type { SceneBlock } from "@/lib/domain/block";
import type { ProjectVariable } from "@/lib/domain/variable";
import {
  collectSceneIssues,
  collectUnresolvedForeshadowMessagesByScene,
} from "./graphIssueDetector";

function makeScene(overrides: Partial<Scene>): Scene {
  return {
    id: "s1",
    projectId: "p1",
    routeId: "r1",
    title: "未命名",
    summary: "",
    sceneType: "normal",
    status: "draft",
    chapterLabel: "",
    sortOrder: 0,
    isStartScene: false,
    isEndingScene: false,
    notes: "",
    blocks: [],
    ...overrides,
  };
}

function makeBlock(overrides: Partial<SceneBlock>): SceneBlock {
  return {
    id: "b1",
    sceneId: "s1",
    blockType: "narration",
    sortOrder: 0,
    characterId: null,
    contentText: "",
    metaJson: null,
    ...overrides,
  };
}

function makeVariable(id: string): ProjectVariable {
  return {
    id,
    projectId: "p1",
    name: id,
    variableType: "flag",
    defaultValue: 0,
  };
}

describe("collectSceneIssues", () => {
  it("空场景报 emptyScene 与 noOutgoing", () => {
    const scene = makeScene({});
    const issues = collectSceneIssues(
      scene,
      new Map([[scene.id, scene]]),
      new Map(),
      0,
      0,
      [],
    );
    const codes = issues.map((issue) => issue.code).sort();
    expect(codes).toEqual(["emptyScene", "noIncoming", "noOutgoing"]);
  });

  it("有块但块都是空文案 → contentGap 而非 emptyScene", () => {
    const scene = makeScene({
      blocks: [
        makeBlock({ id: "b1", blockType: "narration", contentText: "  " }),
        makeBlock({ id: "b2", blockType: "dialogue", contentText: "" }),
      ],
      isStartScene: true,
      isEndingScene: true,
    });
    const issues = collectSceneIssues(
      scene,
      new Map([[scene.id, scene]]),
      new Map(),
      0,
      0,
      [],
    );
    const codes = issues.map((issue) => issue.code);
    expect(codes).toContain("contentGap");
    expect(codes).not.toContain("emptyScene");
  });

  it("choice 块带有非空 label 视为有效内容，不再报 contentGap", () => {
    const scene = makeScene({
      blocks: [
        makeBlock({
          blockType: "choice",
          metaJson: JSON.stringify({ label: "去仓库", targetSceneId: null }),
        }),
      ],
      isStartScene: true,
      isEndingScene: true,
    });
    const issues = collectSceneIssues(
      scene,
      new Map([[scene.id, scene]]),
      new Map(),
      1,
      1,
      [],
    );
    const codes = issues.map((issue) => issue.code);
    expect(codes).not.toContain("emptyScene");
    expect(codes).not.toContain("contentGap");
  });

  it("非结局场景 outgoing=0 报 noOutgoing；非起始 incoming=0 报 noIncoming", () => {
    const scene = makeScene({
      blocks: [makeBlock({ blockType: "narration", contentText: "正文" })],
    });
    const issues = collectSceneIssues(
      scene,
      new Map([[scene.id, scene]]),
      new Map(),
      0,
      0,
      [],
    );
    const codes = issues.map((issue) => issue.code).sort();
    expect(codes).toEqual(["noIncoming", "noOutgoing"]);
  });

  it("起始场景 incoming=0 不报 noIncoming；结局场景 outgoing=0 不报 noOutgoing", () => {
    const scene = makeScene({
      blocks: [makeBlock({ blockType: "narration", contentText: "正文" })],
      isStartScene: true,
      isEndingScene: true,
    });
    const issues = collectSceneIssues(
      scene,
      new Map([[scene.id, scene]]),
      new Map(),
      0,
      0,
      [],
    );
    expect(issues).toEqual([]);
  });

  it("条件块未选变量 → missingConditionVariable", () => {
    const scene = makeScene({
      blocks: [
        makeBlock({ blockType: "narration", contentText: "正文" }),
        makeBlock({
          id: "b2",
          blockType: "condition",
          metaJson: JSON.stringify({
            conditions: [{ variableId: null, operator: "isTrue" }],
          }),
        }),
      ],
      isStartScene: true,
      isEndingScene: true,
    });
    const issues = collectSceneIssues(
      scene,
      new Map([[scene.id, scene]]),
      new Map(),
      0,
      0,
      [],
    );
    const codes = issues.map((issue) => issue.code);
    expect(codes).toContain("missingConditionVariable");
  });

  it("条件块引用已删除变量 → deletedConditionVariable", () => {
    const scene = makeScene({
      blocks: [
        makeBlock({ blockType: "narration", contentText: "正文" }),
        makeBlock({
          id: "b2",
          blockType: "condition",
          metaJson: JSON.stringify({
            conditions: [{ variableId: "missing", operator: "isTrue" }],
          }),
        }),
      ],
      isStartScene: true,
      isEndingScene: true,
    });
    const issues = collectSceneIssues(
      scene,
      new Map([[scene.id, scene]]),
      new Map([["other", makeVariable("other")]]),
      0,
      0,
      [],
    );
    const codes = issues.map((issue) => issue.code);
    expect(codes).toContain("deletedConditionVariable");
  });

  it("choice 跳转到不存在的场景 → missingTargetScene", () => {
    const scene = makeScene({
      blocks: [
        makeBlock({
          blockType: "choice",
          metaJson: JSON.stringify({
            label: "去 X",
            targetSceneId: "missing",
          }),
        }),
      ],
      isStartScene: true,
      isEndingScene: true,
    });
    const issues = collectSceneIssues(
      scene,
      new Map([[scene.id, scene]]),
      new Map(),
      1,
      1,
      [],
    );
    const codes = issues.map((issue) => issue.code);
    expect(codes).toContain("missingTargetScene");
  });

  it("choice 副作用引用已删除变量 → deletedEffectVariable", () => {
    const scene = makeScene({
      blocks: [
        makeBlock({
          blockType: "choice",
          metaJson: JSON.stringify({
            label: "拿钥匙",
            targetSceneId: null,
            effectVariableId: "missing",
            effectValue: 1,
          }),
        }),
      ],
      isStartScene: true,
      isEndingScene: true,
    });
    const issues = collectSceneIssues(
      scene,
      new Map([[scene.id, scene]]),
      new Map([["other", makeVariable("other")]]),
      1,
      1,
      [],
    );
    const codes = issues.map((issue) => issue.code);
    expect(codes).toContain("deletedEffectVariable");
  });

  it("传入未回收伏笔消息 → 一一映射为 unresolvedForeshadow issue", () => {
    const scene = makeScene({
      blocks: [makeBlock({ blockType: "narration", contentText: "正文" })],
      isStartScene: true,
      isEndingScene: true,
    });
    const issues = collectSceneIssues(
      scene,
      new Map([[scene.id, scene]]),
      new Map(),
      0,
      0,
      ["伏笔「钥匙」尚未找到回收点", "伏笔「门」尚未找到回收点"],
    );
    const messages = issues
      .filter((issue) => issue.code === "unresolvedForeshadow")
      .map((issue) => issue.message);
    expect(messages).toEqual([
      "伏笔「钥匙」尚未找到回收点",
      "伏笔「门」尚未找到回收点",
    ]);
  });
});

describe("collectUnresolvedForeshadowMessagesByScene", () => {
  it("无任何注释块时返回空 Map", () => {
    const result = collectUnresolvedForeshadowMessagesByScene([
      makeScene({ id: "s1" }),
    ]);
    expect(result.size).toBe(0);
  });

  it("仅在 foreshadow 没有匹配 payoff 时输出消息", () => {
    const result = collectUnresolvedForeshadowMessagesByScene([
      makeScene({
        id: "s1",
        blocks: [
          makeBlock({
            blockType: "note",
            metaJson: JSON.stringify({
              noteType: "foreshadow",
              threadId: "t-key",
            }),
            contentText: "钥匙",
          }),
        ],
      }),
    ]);
    expect(result.get("s1")).toEqual(["伏笔「钥匙」尚未找到回收点"]);
  });

  it("foreshadow 有匹配 payoff 时不输出（即便在不同场景）", () => {
    const result = collectUnresolvedForeshadowMessagesByScene([
      makeScene({
        id: "s1",
        blocks: [
          makeBlock({
            id: "b1",
            blockType: "note",
            metaJson: JSON.stringify({
              noteType: "foreshadow",
              threadId: "t-key",
            }),
            contentText: "钥匙",
          }),
        ],
      }),
      makeScene({
        id: "s2",
        blocks: [
          makeBlock({
            id: "b2",
            blockType: "note",
            metaJson: JSON.stringify({
              noteType: "payoff",
              threadId: "t-key",
            }),
          }),
        ],
      }),
    ]);
    expect(result.size).toBe(0);
  });

  it("threadId 为空的 foreshadow 不参与匹配（被忽略）", () => {
    const result = collectUnresolvedForeshadowMessagesByScene([
      makeScene({
        id: "s1",
        blocks: [
          makeBlock({
            blockType: "note",
            metaJson: JSON.stringify({
              noteType: "foreshadow",
              threadId: "",
            }),
            contentText: "无线索的伏笔",
          }),
        ],
      }),
    ]);
    expect(result.size).toBe(0);
  });

  it("内容为空时使用 threadId 作为伏笔标题", () => {
    const result = collectUnresolvedForeshadowMessagesByScene([
      makeScene({
        id: "s1",
        blocks: [
          makeBlock({
            blockType: "note",
            metaJson: JSON.stringify({
              noteType: "foreshadow",
              threadId: "old-school-key",
            }),
            contentText: "",
          }),
        ],
      }),
    ]);
    expect(result.get("s1")).toEqual(["伏笔「old-school-key」尚未找到回收点"]);
  });

  it("同一场景多个未回收伏笔合并到该场景下的列表", () => {
    const result = collectUnresolvedForeshadowMessagesByScene([
      makeScene({
        id: "s1",
        blocks: [
          makeBlock({
            id: "b1",
            blockType: "note",
            metaJson: JSON.stringify({
              noteType: "foreshadow",
              threadId: "t1",
            }),
            contentText: "钥匙",
          }),
          makeBlock({
            id: "b2",
            blockType: "note",
            metaJson: JSON.stringify({
              noteType: "foreshadow",
              threadId: "t2",
            }),
            contentText: "门",
          }),
        ],
      }),
    ]);
    expect(result.get("s1")?.length).toBe(2);
  });
});
