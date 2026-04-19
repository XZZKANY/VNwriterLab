# V2 Step 4：editor variables repository 驱动 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 editor store 中的 variables 切到 reference repository 驱动，保留 scenes / blocks / links 的既有持久化现状。

**Architecture:** 继续复用 `referenceRepositoryRuntime`。`useEditorStore` 新增 `hydrateVariables(projectId)`，变量创建、更新、删除后保存当前 project 的变量快照。`EditorPage` 在 current project 存在且 project variables 为空时触发 hydrate。

**Tech Stack:** React 19、TypeScript、Zustand、Vitest、Testing Library

---

### Task 1: 扩展 ReferenceRepository 的变量快照保存能力

**Files:**
- Modify: `src/lib/repositories/referenceRepository.ts`
- Modify: `src/lib/repositories/sqliteReferenceRepository.ts`
- Modify: `src/lib/repositories/referenceRepositoryRuntime.ts`
- Modify: `src/lib/repositories/referenceRepositoryRuntime.test.ts`

- [ ] 新增 `saveVariables(projectId: string, variables: ProjectVariable[]): Promise<void>`
- [ ] sqlite adapter 对 `project_variables` 执行当前 project 删除后重插入
- [ ] volatile runtime 按 project 替换变量集合
- [ ] reference runtime 测试覆盖 `saveVariables`

### Task 2: 为 editor variables repository 行为补失败测试

**Files:**
- Create: `src/features/editor/store/useEditorStore.variablesRepository.test.ts`

- [ ] 测试 `hydrateVariables("p1")` 能恢复变量并设置选中项
- [ ] 测试 `createVariable / updateVariable / deleteVariable` 会调用 `saveVariables`
- [ ] 先运行并确认红灯

### Task 3: 实现 useEditorStore 的 variables repository 契约

**Files:**
- Modify: `src/features/editor/store/useEditorStore.ts`
- Test: `src/features/editor/store/useEditorStore.variablesRepository.test.ts`

- [ ] 新增 `hydrateVariables(projectId)` action
- [ ] create/update/delete 变量后保存当前 project variables 快照
- [ ] 保留变量删除时清理 condition / choice 引用的现有逻辑
- [ ] 跑 store 定向测试转绿

### Task 4: EditorPage 显式 hydrate 与回归测试

**Files:**
- Modify: `src/features/editor/pages/EditorPage.tsx`
- Modify: `src/features/editor/pages/EditorPage.test.tsx`
- Modify: `src/lib/store/persistence.test.ts`

- [ ] 在 EditorPage 中 currentProject 存在且 projectVariables 为空时触发 `hydrateVariables(currentProject.id)`
- [ ] 页面测试补 repository 中变量恢复后显示变量按钮
- [ ] persistence 变量回归从 localStorage 断言调整为 reference repository 恢复断言
- [ ] 跑定向、全量测试和构建
