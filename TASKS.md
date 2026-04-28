# 长期任务队列

## 任务规则
- 状态：`pending` / `in_progress` / `done` / `blocked`
- 完成后必须经过 tsc + test + build 三连验证
- 每完成一个任务在 PROGRESS.md 追加一条记录

## P0 — 路径别名

### T0.1 ✅ done
- **目标**：在 tsconfig / vite / vitest 三处建立 `@/` → `src/` 别名
- **涉及**：`tsconfig.json`、`vite.config.ts`、`vitest.config.ts`
- **验证**：`npx tsc --noEmit` 通过
- **状态**：done（2026-04-27）

### T0.2 ✅ done
- **目标**：把 `from "../../../X"` 与 `from "../../../../X"` 改为别名形式
- **涉及**：`src/**/*.{ts,tsx}`
- **验证**：tsc + test + build 全绿（main bundle hash 不变）
- **结果**：45 个文件 / 125 处替换。脚本按"实际解析路径在 src/ 下"才别名化，避免 3-deep / 4-deep 混用导致的指向错误。
- **状态**：done（2026-04-27）

## P1 — 自动保存包装器（已收敛）

### T1.1 ✅ done
- **目标**：新增 `src/lib/store/autosave.ts` + 测试
- **结果**：实现并通过 3 用例（同步路径、异常路径、参数透传）。

### T1.2 ✅ done（范围已收敛）
- **范围**：仅替换"无 guard 早返回"的 4 处动作（`createScene`、`importScene`、`updateBlockContent`、`createProject`）。
- **决定**：guard 后才标脏的动作保留显式 `markDirty/markSaved` —— 若整体 `withAutosave` 包装会让 no-op 早返回也脏化状态，与原行为不一致；得不偿失。
- **结果**：以上 4 处样板已替换，`useAutoSaveStore` import 仍保留给 guard 路径使用。
- **状态**：done（2026-04-27）

### T1.3 — 不再执行
- 同样原因：character / lore / project 的剩余动作大多有 guard，统一改写无收益。`withAutosave` 仍可在未来的新动作复用。

## P2 — editor block slice 去重

### T2.1 ✅ done
- 合并 `moveBlockUp/Down` 为内部 `moveBlock(direction)` + 对外暴露的 1 行委派
- 抽出 `withSceneBlocks` / `swapBlocks` 工具
- 文件从 270 行减至 207 行

### T2.2 ✅ done
- 抽出 `updateBlockMeta`，`updateConditionBlock` / `updateNoteBlock` 各自一行委派

## P3 — project scene slice 流程抽取

### T3.1 ✅ done
- 抽出 `applyRearrangement(computeCandidate)` 帮助函数
- `moveSceneUp / moveSceneDown / moveSceneToRoute` 各自折叠为一行调用
- 文件从 332 行减至 270 行

## P4 — 长页面拆分

### T4.1 ✅ done
- `EditorPage` 拆分为 `VariablePanel` / `SceneMetadataForm` / `BlockToolbar`
- 主页面从 349 行减至 134 行

### T4.2 ✅ done
- `ProjectHomePage` 拆分为 `ProjectStatsPanel` / `RecentSceneCard` / `RouteListPanel` / `ExportPanel` / `SearchPanel`
- 主页面从 412 行减至 175 行

## 收尾

### T9 ✅ done
- `npx tsc --noEmit` ✅
- `npm test` ✅ 41 文件 / 160 用例
- `npm run build` ✅ 286 KB / gzip 92 KB

## 维护阶段 ✅
- README 全面增补
- `EDITOR_STORAGE_KEY` 改为共享 import
- acceptance smoke 补回"多视图"链接
- 跨 feature 2-deep 相对导入也改为 `@/`
- 代码气味扫描通过

## R3 — 后续低风险拆分（基于真实仓库结构）

### R3.1 ✅ done — 抽 characters helper 到 lib + 单测
新文件 `lib/characterReferences.ts` + 5 个单元测试。

### R3.2 ✅ done — 抽 `CharacterDetailForm`
姓名/身份/性格/目标/秘密 5 字段表单组件。

### R3.3 ✅ done — 抽 `CharacterRouteSummary` + `CharacterSceneReferenceList`
两个展示子组件。CharactersPage 275 → 102 行。

### R3.4 ✅ done — 评估其他 200+ 行组件
结论：LorePage / SceneTree / SceneBlockList 都有可拆分点，分别记录为 R3.5–R3.8。

### R3.5 ✅ done — 抽 lore helper 到 lib + 单测
新文件 `lib/loreSceneAssociations.ts` + 9 个单元测试。

### R3.6 ✅ done — 抽 LoreDetailForm + LoreSceneAssociationList
LorePage 210 → 86 行。

### R3.7 ✅ done — 抽 SceneTree helpers + 单测
新文件 `lib/sceneTreeUtils.ts` + 5 个单元测试。

### R3.8 ✅ done — 拆 SceneBlockList 为 SceneBlockListItem
按 blockType 4 分支抽到独立组件。SceneBlockList 185 → 78 行。

### R3.9 ✅ done — SearchPanel 通用结果区
3 段几乎相同的 sceneResults / characterResults / loreResults 抽成通用 `SearchResultSection`。

### R3.10 ✅ done — GraphPage 摘要拆分
抽 `GraphConditionSummary` / `GraphIssueSummary` / `GraphEdgeSummary`。GraphPage 167 → 108 行。

### R3.11 ✅ done — 拆 SceneTreeRow
路线分组下每行场景的 70+ 行 UI 抽成独立组件。SceneTree 163 → 118 行。

## 高难度任务（用户睡醒后授权）

### A ✅ done — graphData.ts 拆分
`graphData.ts` 457 → 145 行，新增 `graphData.types.ts` / `graphIssueDetector.ts` / `graphConditionSummary.ts` / `graphFilters.ts`。对外 API 完全不变。

### E ✅ done — EditorPage 选择器合并
25 个 store 订阅 → 3 个 `useShallow` 订阅。

### γ ⏸ paused（用户进入上课托管模式时暂停）
- 目标：移除 `Project.scenes` 字段，让 `useEditorStore.scenes` 成为单一真源；删除 `editorSync.ts` 大部分函数
- **暂停原因**：用户切到上课托管模式后，新规则禁止"不属于 bugfix 的核心业务逻辑修改"。γ 是架构重构而非 bugfix，触发 stop 条件 #8（核心业务逻辑无法判断预期行为虽未触发，但规则 9 "不要修改核心业务逻辑，除非已有测试明确覆盖且改动是 bugfix"明确把它排除）。
- **当前状态**：仅完成 γ.0 调研（10 个 Project.scenes 读取点、sqliteProjectRepository 双写流程已识别），未提交任何代码改动
- **后续恢复入口**：用户回来后明确确认要继续，再开新 PR 重启
- **调研产出**（保留备查）：
  1. 10 个读 `currentProject.scenes` / `Project.scenes` 的位置（characters/lore lib、projectSearch、projectStats、editorSync、projectSceneSlice、3 个 test fixture、sqliteProjectRepository、domain.test）
  2. `createEmptyProject` / `createTemplateProject` 需要改为返回 `{ project, initialScenes }` 元组
  3. SQLite 仓储的 `updateProject` 当前会"全删全重写 scenes"——γ 后这个副作用消失，scenes 走 storyRepository
  4. lifecycle slice 的 createProject / importProject 都要拆成 project repo + storyRepo 两路写盘

### β ✅ done — Tauri 文件导入/导出
- 安装 `@tauri-apps/plugin-dialog` + `@tauri-apps/plugin-fs`（前端） + `tauri-plugin-dialog` + `tauri-plugin-fs`（Rust）
- 新增 `src/lib/fileTransfer.ts`：`isTauri()` 分流到原生对话框 / Web `<a download>` + `<input type="file">`
- ExportPanel 增 3 个"保存为 JSON/TXT/RPY 文件"按钮（保留原 3 个 textarea 预览按钮）
- 新增 `ImportPanel` + `parseProjectImport` 校验层（11 种结构错误用中文文案返回）
- project store 加 `importProject` action：替换 currentProject + 刷新 editor + 异步串行落盘
- 测试覆盖：fileTransfer 4 例 + projectImport 13 例

### B ✅ done — CSS 布局工具类
新增 `.layout-split` / `.layout-split--narrow` / `.layout-split--default` / `.layout-split--wide` 三档共享布局类，替换 5 处 inline grid 样式。

### C ✅ done — 解耦 project ↔ editor store
新增 `src/features/projects/store/editorSync.ts` 桥接层（5 个具名同步函数）。`projectHydrationSlice` / `projectLifecycleSlice` / `projectSceneSlice` 不再直接 import `useEditorStore`。

### D ✅ done — 接入 ESLint
- 安装：`eslint@9.39.4` + `@eslint/js` + `typescript-eslint` + `eslint-plugin-react` + `eslint-plugin-react-hooks` + `globals`（dev-only）
- 同时补回 `@testing-library/dom` 缺失的 peer 依赖（避免 `screen` / `waitFor` / `within` 类型丢失）
- 配置：根目录 `eslint.config.js`（flat config），忽略 `dist/` / `node_modules/` / `src-tauri/` / `.worktrees/` / `scripts/`
- 测试文件放宽 `no-explicit-any` / `no-unused-vars`
- `npm run lint` 全绿（0 error / 0 warning）

## 第九轮（2026-04-28）— 低风险任务批次

### Q9.1 ✅ done — 收敛 resolveStartScene 重复
- PreviewPage 本地版与 projectWorkbench 共享版合并
- 共享版加 sortOrder 兜底排序（现有 caller 输入已排序，no-op）
- 新增 2 用例覆盖未排序输入与 isStartScene 优先级

### Q9.2 ✅ done — 补 appShell.config.resolveRouteMeta 单测
- 新增 `src/app/layouts/appShell.config.test.ts`（9 用例）
- 覆盖：分组完整性、路径精确命中、嵌套前缀命中、根路径不误匹配、未知路径回退

### Q9.3 ✅ done — 拆分 ViewsPage
- 270 → 132 行
- 抽出 OutlineView / StatusView / RouteView / ViewsSummary 4 个展示子组件
- 内联 renderActiveView 改为页面内 ActiveView 小组件

### Q9.4 ✅ done — graphIssueDetector 直接单测
- 新增 `src/features/graph/lib/graphIssueDetector.test.ts`（16 用例）
- 覆盖 collectSceneIssues 九种 issue code + 起始/结局豁免 + choice label 非空判断
- 覆盖 collectUnresolvedForeshadowMessagesByScene 六种边界

### Q9.5 ✅ done — sanitizeProjectNameForFile 提到 lib + 单测
- ExportPanel 内部 `sanitizeProjectNameForFile` 移出到 `src/features/projects/lib/projectFileName.ts`
- ExportPanel 171 → 149 行
- 新增 `projectFileName.test.ts`（10 用例）覆盖 Windows 字符、ASCII 控制字符、多空白、首尾点、长度截断、空字符串回退、综合流水线

### 累计验证
- `npx tsc --noEmit` ✅
- `npm run lint` ✅ 0 / 0
- `npm test` ✅ 60 文件 / 376 用例（基线 57 / 339 → +3 文件 / +37 用例）
- `npm run build` ✅ 328 KB / gzip 103 KB

## 已知风险与暂缓项
- ESLint 未配置 → 本次不引入（不属于"重构现有结构"范围）。
- `package.json` 没有显式 lint/start 脚本，已在 RESEARCH.md 中记录。
- `npm run tauri dev` 与 `npm run dev` 的 UI 验证不能在 CLI 完成；本次无法做浏览器/桌面层面的功能验证。
- 页面级 inline grid 样式未抽 CSS 工具类（无 UI 验证手段时风险大于收益）。
