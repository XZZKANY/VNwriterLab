## 项目上下文摘要（V2 SQLite repository adapter）

生成时间：2026-04-09 20:55:00

### 1. 相似实现分析
- **实现1**：`src/lib/repositories/projectRepository.ts`、`storyRepository.ts`、`referenceRepository.ts`
  - 模式：当前只有接口定义，没有实现类
  - 可复用：repository 边界本身已经确定，当前只需要补 adapter
  - 需注意：不能绕过这些接口把 SQL 直接写进 store
- **实现2**：`src/lib/db/database.ts`
  - 模式：提供 `DATABASE_URL` 和惰性 `getDatabase()`
  - 可复用：adapter 最终应通过这里接入 Tauri SQL plugin
  - 需注意：测试环境不适合直接依赖真实 Tauri 连接，应使用可注入执行器
- **实现3**：`src-tauri/src/migrations.rs`
  - 模式：SQLite 表结构已完整存在
  - 可复用：表名、列名、字段类型、关联方向
  - 需注意：migration 中存在 `created_at` / `updated_at` / `status` 等当前 domain 未显式建模字段
- **实现4**：`src/lib/domain/project.ts`、`character.ts`、`lore.ts`、`variable.ts`
  - 模式：domain 创建函数已定义默认值与空对象语义
  - 可复用：createProject/createScene/createVariable 等默认行为语义
  - 需注意：adapter 的 create/save 语义必须尽量对齐这些 domain 默认值

### 2. 项目约定
- 边界定义放在 `src/lib/repositories`
- 数据库连接与 schema 放在 `src/lib/db` 与 `src-tauri/src`
- 测试使用 Vitest，本地验证优先，标题和留痕使用简体中文

### 3. 官方文档结论（Context7）
- `tauri-plugin-sql` 前端最小接入是 `Database.load(...)` + `select/execute`
- migration 注册边界保留在 Rust 插件侧
- 若要作为主存储，前端应先有 adapter/repository 层承接运行时读写

### 4. 本轮设计决定
- 先实现可注入 `SqlExecutor` 的 SQLite adapter，避免测试直接依赖真实 Tauri runtime
- 先从 `ProjectRepository` 开始建立完整模式，再补 `StoryRepository` 与 `ReferenceRepository`
- 通过 domain ↔ row 映射 helper 保持 SQL 层与业务对象隔离

### 5. 风险点
- `projects` 表中的 `status` 字段与当前 domain 不一致，需要明确临时默认值策略
- `scene_blocks`、`lore_entries.tags_json`、布尔字段等需要做序列化/反序列化
- 若一次把所有 store 切到 SQLite，会扩大回归面；本轮只做 adapter
