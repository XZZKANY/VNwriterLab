## 项目上下文摘要（仓库检查）

生成时间：2026-04-08 20:03:28

### 1. 相似实现分析

- **实现 1**：`src/main.tsx` + `src/app/layouts/AppShell.tsx`
  - 模式：React Router 路由入口 + 布局壳层导航
  - 可复用：六大核心页面统一挂载到 `AppShell`
  - 需注意：页面文案与导航命名保持中文一致
- **实现 2**：`src/features/projects/store/useProjectStore.ts`
  - 模式：Zustand + persist 的聚合状态管理
  - 可复用：项目、路线、场景创建与同步逻辑
  - 需注意：与编辑器状态联动较深，删除/移动场景时会同步 editor store
- **实现 3**：`src/features/editor/store/useEditorStore.ts`
  - 模式：编辑器核心状态机，管理场景、变量、块、连线
  - 可复用：块排序、变量更新、选项/条件块元数据处理
  - 需注意：文件体量大，和项目 store 有部分平行逻辑
- **实现 4**：`src/features/projects/pages/ProjectHomePage.tsx`
  - 模式：首页聚合页，整合统计、搜索、继续创作入口
  - 可复用：`buildProjectStats`、`searchProjectContent`、`AutoSaveStatus`
  - 需注意：依赖多个 store 聚合数据
- **实现 5**：`src/features/graph/pages/GraphPage.tsx`
  - 模式：图视图 + 过滤器 + 返回编辑器交互
  - 可复用：`buildSceneGraph`、`applySceneGraphFilters`
  - 需注意：图数据完全由 editor/project 内存状态推导

### 2. 项目约定

- **命名约定**：组件和 store 使用 `PascalCase`/`camelCase`，文案与测试描述使用简体中文
- **文件组织**：前端按 `app / features / lib / test` 分层；功能模块按 `pages / store / components / lib`
- **导入顺序**：通常先第三方依赖，再同层模块，再跨模块依赖
- **代码风格**：TypeScript 严格模式，双引号，尾逗号风格接近 Prettier 默认

### 3. 可复用组件清单

- `src/lib/store/useAutoSaveStore.ts`：全局自动保存状态
- `src/app/components/AutoSaveStatus.tsx`：自动保存状态展示
- `src/features/projects/lib/projectStats.ts`：项目统计计算
- `src/features/projects/lib/projectSearch.ts`：首页全局搜索
- `src/features/graph/lib/graphData.ts`：分支图节点、边、问题摘要构建

### 4. 测试策略

- **测试框架**：Vitest + Testing Library + jsdom
- **测试模式**：单元测试 + 页面交互测试 + 验收冒烟测试
- **参考文件**：`src/features/projects/pages/ProjectHomePage.test.tsx`、`src/features/editor/pages/EditorPage.test.tsx`、`src/test/app.acceptance.test.tsx`
- **覆盖特点**：大量通过用户事件驱动 store 与 UI 联动验证，并在 `beforeEach` 中清空 localStorage 和重置 store

### 5. 依赖和集成点

- **外部依赖**：React 19、React Router 7、Zustand 5、React Flow、Tauri 2、tauri-plugin-sql
- **内部依赖**：projects store 与 editor store 双向耦合；首页聚合 characters/lore/editor/project/autosave 四类状态
- **集成方式**：前端目前以本地 persist store 为主；Tauri SQLite 与 migrations 已接入但主路径尚未全面切换
- **配置来源**：`package.json`、`vite.config.ts`、`vitest.config.ts`、`src-tauri/tauri.conf.json`

### 6. 技术选型理由

- React + Vite：前端开发与构建效率高
- Tauri + SQLite：桌面端分发轻量，具备本地数据落盘能力
- Zustand + persist：适合当前以本地创作态为中心的前端状态管理

### 7. 关键风险点

- `vitest` 默认扫描到了 `.worktrees`，导致主仓库测试结果被工作树污染
- `useProjectStore.ts` 与 `useEditorStore.ts` 体量偏大，后续维护成本高
- SQLite 基础设施已存在，但 repositories/database 与当前 localStorage 主路径存在落差
- `EditorPage` 测试存在 `act(...)` 警告，说明测试同步边界仍可优化
