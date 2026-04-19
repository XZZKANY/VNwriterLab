## 项目上下文摘要（V1.5 repositories / SQLite 收敛）

生成时间：2026-04-09 20:31:00

### 1. 相似实现分析
- **实现1**：`src/lib/repositories/projectRepository.ts`、`storyRepository.ts`、`referenceRepository.ts`
  - 模式：当前只有 TypeScript 接口定义，没有任何实现类或调用方
  - 需注意：这说明 repositories 目前只是边界占位，不是运行时主路径
- **实现2**：`src/lib/db/database.ts` 与 `src/lib/db/schema.test.ts`
  - 模式：前端只有 `DATABASE_URL` 与 `getDatabase()` 连接入口，现有测试也只验证默认 SQLite 文件路径
  - 需注意：`getDatabase` 在 `src/**` 中没有业务调用，说明 SQLite 还未接入前端读写主链
- **实现3**：`src-tauri/src/lib.rs` 与 `src-tauri/src/migrations.rs`
  - 模式：Rust 侧已注册 SQL plugin 与 v1 migration，表结构覆盖 projects/routes/scenes/blocks/links/characters/lore/variables/conditions
  - 需注意：这只是基础设施已就位，不代表前端已消费这些表
- **实现4**：`useProjectStore.ts`、`useEditorStore.ts`、`useCharacterStore.ts`、`useLoreStore.ts`、`useAutoSaveStore.ts`
  - 模式：当前 5 个 store 全部继续使用 Zustand `persist`，主持久化仍是 localStorage
  - 需注意：直接把 store 改成双写 SQLite 会扩大回归面

### 2. 关键证据
- 搜索 `ProjectRepository|StoryRepository|ReferenceRepository`：只命中接口文件本身，没有业务消费方
- 搜索 `getDatabase`：只命中 `src/lib/db/database.ts` 自身
- 搜索 `@tauri-apps/plugin-sql`：只命中 `src/lib/db/database.ts`
- 搜索 `persist(`：命中 5 个 store，说明当前主运行时路径仍是 localStorage

### 3. 官方文档结论（Context7）
- `tauri-plugin-sql` 的前端最小接入是 `Database.load(...)` + `select/execute`
- migration 注册边界应保留在 Rust 插件侧
- 若要把 SQLite 变成真正主存储，前端必须先有清晰的 repository / adapter 层承接读写

### 4. 结论
- 本段不应做猜测性的 SQLite 接线改造，因为当前前端没有任何 repository/database 运行时消费者
- V2 起点应分两步：
  1. 先实现 `ProjectRepository` / `StoryRepository` / `ReferenceRepository` 的 SQLite adapter
  2. 再让各 store 从 `persist + localStorage` 切到 `repository hydration/save` 主路径

### 5. 风险点
- 若现在直接让 store 双写 localStorage + SQLite，会把同步、恢复、冲突与测试范围同时放大
- 若跳过 adapter 直接在 store 内写 SQL，会破坏当前 `src/lib/repositories` 已声明的边界
- 若没有先定义 hydration/save contract，后续很难安全移除 `persist`
