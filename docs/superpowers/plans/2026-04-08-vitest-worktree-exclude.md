# Vitest 排除 worktree 污染 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让根工作区的 `npm.cmd test` 不再扫描 `.worktrees`，得到真实测试结论。

**Architecture:** 仅修改根级 `vitest.config.ts`。通过继承 Vitest 默认排除项并追加 `**/.worktrees/**`，在不影响现有主工作区测试发现的前提下隔离 worktree 污染。验证采用命令级 red/green，而不是新增业务测试。

**Tech Stack:** Vitest 4、TypeScript、Vite 配置、npm 脚本

---

### Task 1: 记录 red 基线并修改配置

**Files:**
- Modify: `vitest.config.ts`
- Reference: `docs/superpowers/specs/2026-04-08-vitest-worktree-exclude-design.md`

- [ ] **Step 1: 记录当前失败基线**

运行：`npm.cmd test`

预期：输出中包含 `.worktrees/v1-5-content-gap-rule/...`，说明测试发现被污染。

- [ ] **Step 2: 修改 Vitest 配置**
```ts
import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./src/test/setupTests.ts",
    exclude: [...configDefaults.exclude, "**/.worktrees/**"],
  },
});
```

- [ ] **Step 3: 运行完整测试验证 green**

运行：`npm.cmd test`

预期：输出中不再包含 `.worktrees` 路径，结果仅反映主工作区测试。

- [ ] **Step 4: 如需补充，运行构建验证**

运行：`npm.cmd run build`

预期：构建成功，不因配置变更产生额外问题。

### Task 2: 输出后续顺序

**Files:**
- Modify: `.codex/operations-log.md`
- Modify: `.codex/verification-report.md`

- [ ] **Step 1: 记录验证结果**

在 `.codex/operations-log.md` 追加本次 red/green 命令、输出摘要与结论。

- [ ] **Step 2: 记录验证评分**

在 `.codex/verification-report.md` 追加本次最小修复的验证结果与建议。

- [ ] **Step 3: 输出后续推荐顺序**

顺序固定为：
1. 清理 `EditorPage.test.tsx` 的 `act(...)` 警告
2. 拆分大体量 store 的纯逻辑与职责边界
3. 以 `repositories` 为边界推进 SQLite 收敛

备注：当前工作区已有未提交改动，本轮不执行 git commit。
