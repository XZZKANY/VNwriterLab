## 项目上下文摘要（Vitest 主工作区验证与收敛规划）

生成时间：2026-04-08 20:22:00

### 1. 相似实现分析

- **实现 1**：`vitest.config.ts`
  - 模式：当前仅声明 `environment / globals / setupFiles`
  - 可复用：直接在 `test` 节点扩展排除策略
  - 需注意：Vitest 4 自定义 `exclude` 会替换默认值
- **实现 2**：`vite.config.ts`
  - 模式：通过 `server.watch.ignored` 显式忽略 `src-tauri`
  - 可复用：沿用“显式 ignore 某类目录”的配置风格
  - 需注意：不要误伤主工作区 `src/**` 测试发现
- **实现 3**：`src/features/projects/store/useProjectStore.ts`
  - 模式：大体量 Zustand + persist 聚合 store
  - 可复用：项目、路线、场景聚合 API
  - 需注意：存在与 editor store 的深度联动，后续拆分必须保留边界
- **实现 4**：`src/features/editor/store/useEditorStore.ts`
  - 模式：编辑器核心状态机，负责场景、变量、块、连线
  - 可复用：块归一化与选择/更新动作
  - 需注意：体量大且测试覆盖复杂，是后续拆分重点
- **实现 5**：`src/lib/repositories/*.ts` + `src/lib/db/database.ts` + `src-tauri/src/migrations.rs`
  - 模式：repository 接口 + SQLite 连接入口 + Rust migration
  - 可复用：后续 SQLite 收敛的边界基础
  - 需注意：当前主路径仍以 localStorage persist 为主

### 2. 项目约定

- **命名约定**：测试描述与界面文案使用简体中文；代码标识符沿用英文
- **文件组织**：测试配置在根目录；业务逻辑按 `features/*/(pages|store|lib)` 组织；数据库边界在 `src/lib/db` 与 `src/lib/repositories`
- **测试风格**：Vitest + Testing Library + jsdom；多数页面测试通过 `beforeEach` 清空 localStorage 和重置 store

### 3. 官方文档结论（Context7）

- **Vitest**：推荐基于 `configDefaults.exclude` 追加目录；Vitest 4 默认仅排除 `node_modules` 和 `.git`
- **Zustand**：推荐用 slices pattern 或按领域拆分多个 store，再通过组合保持 API 清晰
- **Tauri SQL Plugin**：migration 应由 Rust 插件注册，前端通过 `Database.load` 获取连接，数据读写责任应下沉到 repository 层

### 4. 关键风险点

- 若直接写 `exclude` 而不继承默认值，可能把 Vitest 默认排除规则覆盖掉
- 若把 `.worktrees` 修复与 store/SQLite 重构混做，会扩大回归范围
- `EditorPage.test.tsx` 的 `act(...)` 警告说明测试同步边界需要单独处理
- store 拆分若不保留现有外部 API，会引发大量页面与测试联动回归
