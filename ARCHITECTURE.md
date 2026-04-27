# 架构记录

## 当前架构（截至 2026-04-27）

### 分层
1. **领域层** `src/lib/domain/`：纯 TypeScript 类型 + 工厂函数，无副作用，无外部依赖。
2. **仓储层** `src/lib/repositories/`：每个聚合都有
   - 抽象接口 `xxxRepository.ts`
   - SQLite 实现 `sqliteXxxRepository.ts`
   - 运行时入口 `xxxRepositoryRuntime.ts`（控制内存或 SQLite）
3. **状态层** `src/features/<feature>/store/`：基于 zustand，已经按职责拆 slice。
4. **视图层** `src/features/<feature>/{pages,components}/`。
5. **应用骨架** `src/main.tsx` + `src/app/layouts/AppShell.tsx`：路由 + 布局。

### 状态切片当前组合
- **editor store** 5 个 slice：hydration、scene、variable、block、choiceLink
- **project store** 4 个 slice：hydration、lifecycle、route、scene
- **character / lore / autosave** 仍是单个 store（小，未拆分）

### 模块边界
- `editor` 与 `projects` 通过 store 互相持有引用：
  - `projects/store/slices/projectSceneSlice.ts` 直接调用 `useEditorStore.setState(...)` 同步场景
  - `projects/store/slices/projectHydrationSlice.ts` 直接调用 `useEditorStore.setState(...)` 写入水合数据
  - 这是已经存在的耦合，本次重构**保持不变**。

## 重构方案（不破坏现有功能）

### P0 — 路径别名
- 在 `tsconfig.json` 增加 `paths: { "@/*": ["src/*"] }`
- 在 `vite.config.ts`、`vitest.config.ts` 增加 `resolve.alias`
- 把 `from "../../../X"`、`from "../../../../X"` 替换为 `from "@/X"`
- ⚠️ 必须按文件深度精确替换，不能只看相对路径前缀（已踩坑见 PROGRESS.md）

### P1 — 自动保存包装器
- 新增 `src/lib/store/autosave.ts`，导出 `withAutosave(action)` 高阶函数
- 内部封装 `markDirty → action() → markSaved` 顺序
- 把 ~40 处样板替换为 `withAutosave(() => { ... })`
- 仍允许 slice 内部主动管理 hydrated 状态（hydration slice 不动）

### P2 — editor block slice 去重
- `moveBlockUp/Down` → `moveBlock(sceneId, blockId, direction: -1 | 1)`，对外暴露的两个 action 用包装委派
- `updateConditionBlock/updateNoteBlock` → 抽取 `applyBlockMetaUpdate(sceneId, blockId, metaJson)`
- 公开 API（store 外暴露的 action 名）保持不变

### P3 — project scene slice 流程抽取
- 抽 `applyProjectSceneMutation` 帮助函数：归一化 → setProjectState → 同步 editor → 写盘
- `moveSceneUp / moveSceneDown / moveSceneToRoute / deleteScene / updateScene` 共用此流程

### P4 — 长页面拆分
- `EditorPage` 拆为：`VariablePanel`、`SceneMetadataForm`、`BlockToolbar`，主页面只组合
- `ProjectHomePage` 拆为：`ProjectStatsPanel`、`RouteListPanel`、`RecentSceneCard`、`ExportPanel`、`SearchPanel`
- 拆分文件放在对应 feature 的 `components/` 下

## 风险评估
| 改动 | 风险 | 缓解 |
|------|------|------|
| 路径别名 | 低 | tsc + 测试一次性验证 |
| `withAutosave` | 低-中 | 保持 action 行为完全等价，先小步替换一个 slice 跑测 |
| slice 内部去重 | 中 | 每个 slice 改完单跑相关测试再下一个 |
| 页面拆分 | 中 | 不改 prop 接口、保持 store 用法不变；测试覆盖 EditorPage/ProjectHomePage 已存在 |

## 必须保持不变的功能
1. store 对组件暴露的 action 名与签名（保证页面无须改动）
2. SQLite/内存仓储 API 与持久化字段
3. 路由 URL 与懒加载结构
4. 自动保存语义（dirty/saved/hydrated 三状态）
5. 测试用例（不能为了改实现而改测试期望，除非功能确实变化）

## 不做的事
- 不引入新依赖（任何 npm 包）
- 不改 SQL schema、领域模型、prop 接口
- 不动 reactflow / preview engine 内部逻辑
- 不替换 zustand
- 不引入新的 lint/format 工具（项目当前没有，超出本次"重构"范畴）
- 不创建新的运行入口或脚本

## P0~P4 落地后状态（2026-04-27）

### 新增模块
- `src/lib/store/autosave.ts` — `withAutosave(action)` 高阶函数
- `src/features/editor/components/VariablePanel.tsx`
- `src/features/editor/components/SceneMetadataForm.tsx`
- `src/features/editor/components/BlockToolbar.tsx`
- `src/features/projects/components/ProjectStatsPanel.tsx`
- `src/features/projects/components/RecentSceneCard.tsx`
- `src/features/projects/components/RouteListPanel.tsx`
- `src/features/projects/components/ExportPanel.tsx`
- `src/features/projects/components/SearchPanel.tsx`

### 新增 slice 内部工具
- `editorBlockSlice` 中的 `withSceneBlocks` / `swapBlocks` / `moveBlock` / `updateBlockMeta`
- `projectSceneSlice` 中的 `applyRearrangement` / `syncEditorScenesAfterRearrangement`

### 命名导入约定（新规范）
- `src/` 内不再使用 `../../../` 或更深的相对路径，统一用 `@/`
- 同包内（同目录或父目录一两层）仍允许 `./X` / `../X` 以保持就近聚合性

### 公开 API 不变
- store action 的对外签名一律不变
- 页面 prop 接口不变
- AutoSaveStatus 的语义不变

## R3 落地后状态（2026-04-27）

### 新增 lib（带单测）
- `src/features/characters/lib/characterReferences.ts`
- `src/features/lore/lib/loreSceneAssociations.ts`
- `src/features/editor/lib/sceneTreeUtils.ts`

### 新增展示子组件
- `characters/components/CharacterDetailForm.tsx`
- `characters/components/CharacterRouteSummary.tsx`
- `characters/components/CharacterSceneReferenceList.tsx`
- `lore/components/LoreDetailForm.tsx`
- `lore/components/LoreSceneAssociationList.tsx`
- `editor/components/SceneBlockListItem.tsx`
- `editor/components/SceneTreeRow.tsx`
- `projects/components/SearchResultSection.tsx`
- `graph/components/GraphConditionSummary.tsx`
- `graph/components/GraphIssueSummary.tsx`
- `graph/components/GraphEdgeSummary.tsx`

### 模块边界规范（沿用 P4 + R3）
- **页面（pages）**：只负责接 store、组合子组件、传递 props；不写长 JSX。
- **components/**：纯展示或局部状态的小组件，由对应页面装配。
- **lib/**：纯函数 / 视图工具 / 派生数据计算；必须配单测。
- **store/slices/**：状态变更与持久化的协作；slice 内部允许私有 helper。

任何超过 ~200 行的页面 tsx 都应优先按上述边界分解。

## 高难度阶段（A + E + B + C + D）落地后状态（2026-04-27）

### A：graphData.ts 拆分
原 457 行 lib 拆为：
- `graphData.types.ts`（53）— 全部类型
- `graphIssueDetector.ts`（190）— 问题检测
- `graphConditionSummary.ts`（74）— 条件块摘要
- `graphFilters.ts`（69）— 视图过滤
- `graphData.ts`（145）— `buildSceneGraph` 协调器 + 类型 barrel re-export，**对外 API 不变**

### E：选择器收敛
EditorPage 25 个独立 store 订阅 → 3 个 `useShallow` 订阅。

### B：CSS 工具类
新增 `.layout-split` + 三档修饰，替换 5 处 inline grid。

### C：跨 store 桥接层
`src/features/projects/store/editorSync.ts` 集中所有"项目动作 → editor 副作用"。
3 个 project slice 不再 import editor store。

### D：ESLint 接入
`eslint.config.js`（flat config）。
- 规则：`@eslint/js` + `typescript-eslint` + `react` + `react-hooks` 全部 recommended
- React 19 特例：关闭 `react/react-in-jsx-scope` 与 `react/prop-types`
- 测试文件放宽 `no-explicit-any` 与 `no-unused-vars`
- `npm run lint` 全绿

### 模块边界（更新版）
- **跨 store 同步**：通过 feature 内部的 `editorSync.ts` 桥接层封装；slice 文件不持有外部 store 引用。
- **类型 barrel**：lib 模块拆分时通过原文件 re-export 维持外部导入路径稳定。
- **Lint 规则**：开发期由 ESLint 9 + tseslint 8 守住；CI 接入应跑 `npm run lint` 与 `npx tsc --noEmit` + `npm test` + `npm run build` 四件套。
