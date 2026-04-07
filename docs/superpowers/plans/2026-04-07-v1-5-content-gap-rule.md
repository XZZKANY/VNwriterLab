# V1.5 内容缺失规则 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为分支图结构治理新增“内容缺失”规则，识别“场景已有块但没有任何有效正文或选项文案”的情况，并在现有问题明细中稳定展示。

**Architecture:** 继续沿用 `graph` feature 的纯函数诊断模式，把规则收敛在 `src/features/graph/lib/graphData.ts`，页面只消费 `issueSummaries` 结果，不新增 store、service 或新的展示协议。本轮同时锁定 `空场景` 与 `内容缺失` 的边界：无块仍是 `空场景`，有块但无有效内容才是 `内容缺失`。

**Tech Stack:** React 19、TypeScript、Zustand、Vitest、Testing Library

---

## Task 1: 锁定纯函数失败测试

**Files:**
- Modify: `src/features/graph/lib/graphIssueCategories.test.ts`
- Reference: `src/features/graph/lib/graphData.ts:1-372`
- Reference: `src/features/editor/store/choiceBlock.ts:1-86`

- [ ] **Step 1: 为“有块但无有效内容”写失败测试**

```ts
it("会把只有结构块或空白文本的场景标记为内容缺失", () => {
  const graph = buildSceneGraph(
    [
      {
        id: "s1",
        projectId: "p1",
        routeId: "r1",
        title: "只剩结构的场景",
        summary: "",
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
            blockType: "condition",
            sortOrder: 0,
            characterId: null,
            contentText: "",
            metaJson: null,
          },
          {
            id: "b2",
            sceneId: "s1",
            blockType: "choice",
            sortOrder: 1,
            characterId: null,
            contentText: "",
            metaJson: JSON.stringify({
              label: "   ",
              targetSceneId: null,
              effectVariableId: null,
              effectValue: 0,
            }),
          },
        ],
      },
    ],
    [],
    [],
  );

  expect(graph.issueSummaries).toEqual([
    expect.objectContaining({
      sceneId: "s1",
      categories: expect.arrayContaining(["内容缺失"]),
      issues: expect.arrayContaining(["当前场景还没有任何有效正文或选项文案"]),
    }),
  ]);
});
```

- [ ] **Step 2: 为“只要有一个有效内容就不命中”写失败测试**

```ts
it("只要存在一个有效正文或选项文案就不会命中内容缺失", () => {
  const graph = buildSceneGraph(
    [
      {
        id: "s1",
        projectId: "p1",
        routeId: "r1",
        title: "有正文的场景",
        summary: "",
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
            blockType: "note",
            sortOrder: 0,
            characterId: null,
            contentText: "   ",
            metaJson: null,
          },
          {
            id: "b2",
            sceneId: "s1",
            blockType: "dialogue",
            sortOrder: 1,
            characterId: null,
            contentText: "终于开口了。",
            metaJson: null,
          },
        ],
      },
    ],
    [],
    [],
  );

  expect(graph.issueSummaries).toEqual([]);
});
```

- [ ] **Step 3: 运行纯函数测试，确认先红灯**

Run: `npm.cmd test -- src/features/graph/lib/graphIssueCategories.test.ts`
Expected: 至少 1 个测试失败，且失败原因与 `内容缺失` 尚未实现一致

- [ ] **Step 4: 提交纯函数失败测试**

```bash
git add src/features/graph/lib/graphIssueCategories.test.ts
git commit -m "为内容缺失规则补失败测试"
```

## Task 2: 在 graphData 中实现内容缺失规则

**Files:**
- Modify: `src/features/graph/lib/graphData.ts`
- Reference: `src/lib/domain/block.ts:1-16`
- Reference: `src/features/editor/store/choiceBlock.ts:1-86`
- Test: `src/features/graph/lib/graphIssueCategories.test.ts`

- [ ] **Step 1: 在 graphData 中抽出“是否有有效内容”辅助函数**

```ts
function hasMeaningfulSceneContent(scene: Scene) {
  return scene.blocks.some((block) => {
    if (block.blockType === "dialogue" || block.blockType === "narration") {
      return block.contentText.trim().length > 0;
    }

    if (block.blockType === "choice") {
      return parseChoiceBlockMeta(block.metaJson).label.trim().length > 0;
    }

    return false;
  });
}
```

- [ ] **Step 2: 扩展 issue code，并在 collectSceneIssues 中加入新规则**

```ts
export type SceneGraphIssueCode =
  | "emptyScene"
  | "contentGap"
  | "noIncoming"
  | "noOutgoing"
  | "missingConditionVariable"
  | "deletedConditionVariable"
  | "missingTargetScene"
  | "deletedEffectVariable";
```

```ts
if (scene.blocks.length === 0) {
  issues.push(
    createIssue("emptyScene", "空场景", "当前场景还没有任何内容块"),
  );
} else if (!hasMeaningfulSceneContent(scene)) {
  issues.push(
    createIssue(
      "contentGap",
      "内容缺失",
      "当前场景还没有任何有效正文或选项文案",
    ),
  );
}
```

- [ ] **Step 3: 运行纯函数测试，确认红转绿且边界不串线**

Run: `npm.cmd test -- src/features/graph/lib/graphIssueCategories.test.ts`
Expected: PASS

- [ ] **Step 4: 提交最小实现**

```bash
git add src/features/graph/lib/graphData.ts src/features/graph/lib/graphIssueCategories.test.ts
git commit -m "实现内容缺失规则"
```

## Task 3: 补页面展示回归并完成验证收口

**Files:**
- Modify: `src/features/graph/pages/GraphPage.issueCategories.test.tsx`
- Reference: `src/features/graph/pages/GraphPage.tsx:1-155`
- Reference: `src/features/graph/pages/GraphPage.test.tsx:1-685`
- Test: `src/features/graph/lib/graphIssueCategories.test.ts`

- [ ] **Step 1: 在页面测试中补“内容缺失”展示用例**

```ts
it("会显示内容缺失分类和问题文案", () => {
  useProjectStore.setState({
    currentProject: {
      id: "p1",
      name: "雨夜回响",
      summary: "",
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
  });

  useEditorStore.setState({
    scenes: [
      {
        id: "s1",
        projectId: "p1",
        routeId: "r1",
        title: "待补正文场景",
        summary: "",
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
            blockType: "note",
            sortOrder: 0,
            characterId: null,
            contentText: "   ",
            metaJson: null,
          },
        ],
      },
    ],
    links: [],
    selectedSceneId: "s1",
    variables: [],
  });

  render(
    <MemoryRouter initialEntries={["/graph"]}>
      <Routes>
        <Route path="/graph" element={<GraphPage />} />
      </Routes>
    </MemoryRouter>,
  );

  const issueSummary = screen.getByRole("region", { name: "问题明细" });

  expect(within(issueSummary).getByText("待补正文场景")).toBeInTheDocument();
  expect(within(issueSummary).getByText("问题分类：内容缺失")).toBeInTheDocument();
  expect(
    within(issueSummary).getByText("当前场景还没有任何有效正文或选项文案"),
  ).toBeInTheDocument();
});
```

- [ ] **Step 2: 跑 graph 定向测试，确认页面和纯函数一起通过**

Run: `npm.cmd test -- src/features/graph/lib/graphIssueCategories.test.ts src/features/graph/pages/GraphPage.issueCategories.test.tsx src/features/graph/pages/GraphPage.test.tsx`
Expected: PASS

- [ ] **Step 3: 跑全量测试与构建收口**

Run: `npm.cmd test`
Expected: PASS

Run: `npm.cmd run build`
Expected: PASS

- [ ] **Step 4: 提交展示回归与最终收口**

```bash
git add src/features/graph/pages/GraphPage.issueCategories.test.tsx
git commit -m "补齐内容缺失规则展示回归"
```

## 自检清单

- [ ] 计划只覆盖“内容缺失”这一条规则，没有越界到摘要缺失、占位标题或问题排序
- [ ] 所有关键文件路径都已写明
- [ ] 所有测试命令都与当前仓库脚本一致
- [ ] `空场景` 与 `内容缺失` 的边界在任务和测试中都有明确约束
- [ ] choice 的有效内容来源已明确写为 `metaJson.label`
