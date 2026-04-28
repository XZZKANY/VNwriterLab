# 项目研究记录

## 项目用途
VN 写作工具 V1 桌面版（Tauri 桌面应用），用于可视小说作家进行剧情、分支、角色、设定、预览等闭环创作。

## 技术栈
- **桌面壳**：Tauri 2 + Rust（`src-tauri/`）
- **前端**：React 19 + TypeScript ~5.8 + Vite 7 + react-router 7
- **状态管理**：zustand 5（采用 slice 化组合）
- **图形可视化**：reactflow 11（用于分支图）
- **数据持久化**：`@tauri-apps/plugin-sql`（SQLite），运行时仓储分内存与 SQLite 两种实现
- **测试**：vitest 4 + @testing-library/react + jsdom

## 入口与运行方式
| 命令 | 用途 | CLI 验证状态 |
|------|------|----------|
| `npm install` | 安装依赖 | 已就绪，未触发安装 |
| `npm run dev` | 启动 Vite 前端开发服务器（不含 Tauri 壳） | 未实测（CLI 无桌面环境） |
| `npm run tauri dev` | 启动完整 Tauri 桌面开发模式 | 不可在 CLI 验证（需要 Rust 工具链 + GUI） |
| `npm test` | 单跑 vitest 全量 | ✅ 40 文件 / 157 用例全绿 |
| `npm run test:watch` | watch 模式 vitest | 未实测 |
| `npm run build` | TypeScript 检查 + Vite 构建 | ✅ 成功，main bundle ~286 KB（gzip 92 KB） |
| `npx tsc --noEmit` | 单独类型检查 | ✅ 通过 |
| **lint** | 项目当前**未配置 ESLint**，仅靠 `tsc strict` 把关 | — |

## 关键目录与模块
```
src/
├─ main.tsx                       # 路由入口，懒加载页面
├─ styles.css                     # 全局样式（深色主题，BEM 风格）
├─ app/
│  ├─ layouts/AppShell.tsx        # 侧边导航 + Outlet 容器
│  └─ components/AutoSaveStatus.tsx
├─ features/
│  ├─ projects/                   # 项目首页：模板、路线、统计、搜索、导出
│  │  ├─ pages/ProjectHomePage.tsx        (412 行，待拆分)
│  │  ├─ components/ProjectCreateForm.tsx
│  │  ├─ lib/{projectExport,projectSearch,projectStats}.ts
│  │  └─ store/                   # 4 个 slice：hydration / lifecycle / route / scene
│  ├─ editor/                     # 剧情编辑：场景树、块编辑器、变量
│  │  ├─ pages/EditorPage.tsx              (349 行，待拆分)
│  │  ├─ components/{SceneTree,SceneBlockList,Choice/Condition/NoteBlockEditor}.tsx
│  │  └─ store/                   # 5 个 slice：hydration / scene / variable / block / choiceLink
│  ├─ graph/                      # 分支图（reactflow）
│  ├─ views/                      # 多视图（大纲）
│  ├─ characters/ / lore/         # 角色 / 设定参考
│  └─ preview/                    # 预览引擎
└─ lib/
   ├─ domain/                     # 纯类型 + 工厂（block/scene/link/project/variable/character/lore）
   ├─ repositories/               # SQLite 与内存运行时两套实现
   └─ store/useAutoSaveStore.ts   # 自动保存状态（持久化）
```

## 重要约束
- **AGENTS.md 强制简体中文**：注释/文档/提交信息一律中文，标识符按既有约定（英文）。
- **强制本地验证**：禁止依赖远程 CI；改动后必须本地 tsc/test/build 三连。
- **TypeScript 严格模式**：`strict`、`noUnusedLocals`、`noUnusedParameters` 均开启。

## 数据持久化路径
- 运行时仓储入口：`src/lib/repositories/{project,story,reference}RepositoryRuntime.ts`
- 运行时存在 SQLite 与内存两种实现，通过 runtime getter 函数切换。
- editor slice 的 `saveXxxSnapshot` 写入流程在 `src/features/editor/store/slices/repositorySnapshots.ts` 集中。

## 已识别的代码气味（详见 ARCHITECTURE.md 重构方案）
1. ~~深层相对导入 `../../../{,../}` 共出现 130+ 次~~ → 已通过 `@/` 别名收敛
2. ~~长页面组件：`ProjectHomePage` 412 行、`EditorPage` 349 行~~ → 已拆，对应数字降至 153 / 182
3. ~~slice 中 `markDirty/markSaved/saveSnapshot` 样板重复~~ → 已经 `withAutosave` 包装并 slice 化
4. ~~`moveBlockUp/Down` 与 `updateConditionBlock/updateNoteBlock` 内部高度雷同~~ → 已用 `moveBlock` / `updateBlockMeta` 收敛
5. ~~`projectSceneSlice` 中 `moveSceneUp/Down/ToRoute` 几乎是镜像实现~~ → 已用 `applyRearrangement` 收敛
6. ~~`EditorPage` 单组件中 23 次独立 `useEditorStore` 订阅~~ → 已收敛为 3 个 `useShallow` 订阅

## 当前测试覆盖现状（截至 2026-04-28）
- 测试文件：60，用例总数：376
- 直接单测覆盖的核心 lib：projectWorkbench / projectFileName / projectSearch / projectStats / projectExport / projectImport / characterReferences / loreSceneAssociations / sceneTreeUtils / outlineView / viewsDashboard / graphData / graphConditionSummary / graphFilters / graphIssueDetector / previewEngine / fileTransfer
- store slice 通过 `createXxxStoreState.test.ts` 与页面集成测试双重覆盖
- repository（SQLite + runtime）有完整 adapter 测试
- 自动保存语义有 `useAutoSaveStore.test.ts` 与 `persistence.test.ts` 双重保护

## 已知重复 / 共享逻辑入口
- `resolveStartScene` / `resolveRecentScene` / `mergeProjectAndEditorScenes` / `buildProjectStats`：唯一定义在 `src/features/projects/lib/projectWorkbench.ts`
- 文件名安全化：`src/features/projects/lib/projectFileName.ts`
- 跨 store 同步：`src/features/projects/store/editorSync.ts`
