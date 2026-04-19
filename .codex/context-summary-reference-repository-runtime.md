## 项目上下文摘要（reference repository runtime 边界）

生成时间：2026-04-11 03:47:44

### 1. 相似实现分析

- **实现1**: `src/lib/repositories/projectRepositoryRuntime.ts`
  - 模式：`override + singleton + canUseSqliteRuntime + volatile Map`
  - 可复用：`get/set/reset` 注入模式、`createVolatile*Repository()` 结构、Tauri 环境判断
  - 需注意：重载测试时要先 `reset*ForTesting()` 再重新注入，避免模块缓存干扰
- **实现2**: `src/lib/repositories/sqliteReferenceRepository.ts`
  - 模式：SQLite 访问层，支持 `SqlExecutorFactory` 注入
  - 可复用：`createSqliteReferenceRepository(createExecutor?)` 作为 runtime 选择的 Tauri 分支
  - 需注意：runtime 不应改写 SQL 细节，只负责调度
- **实现3**: `src/lib/repositories/referenceRepository.ts`
  - 模式：纯契约接口
  - 可复用：现有 `ReferenceRepository` 签名已覆盖 runtime 需要的读写能力
  - 需注意：如果后续出现测试注入需要新方法，再补契约；当前不需要改接口

### 2. 项目约定

- **命名约定**: runtime 文件使用 `*RepositoryRuntime.ts`；注入函数使用 `set*ForTesting` / `reset*ForTesting`
- **文件组织**: `src/lib/repositories` 下拆分为契约、SQLite 实现、runtime 边界三层
- **导入顺序**: 先 domain 类型，再本模块契约，再具体实现
- **代码风格**: TypeScript 严格模式，函数式导出，局部 `Map` 作为 volatile 存储

### 3. 可复用组件清单

- `src/lib/repositories/projectRepositoryRuntime.ts`：runtime 边界范式
- `src/lib/repositories/sqliteReferenceRepository.ts`：Tauri 分支实现
- `src/lib/repositories/referenceRepository.ts`：仓库契约

### 4. 测试策略

- **测试框架**: Vitest
- **测试模式**: 以 repository 单元测试为主，直接断言返回值与注入行为
- **参考文件**: `src/lib/repositories/sqliteReferenceRepository.test.ts`、`src/lib/repositories/sqliteProjectRepository.test.ts`、`src/features/projects/store/useProjectStore.repository.test.ts`
- **覆盖要求**: 非 Tauri 分流、Tauri 分流、`set/reset` 注入恢复、volatile repo 基本读写

### 5. 依赖和集成点

- **外部依赖**: `@tauri-apps/plugin-sql` 仅在 Tauri 分支使用
- **内部依赖**: `../domain/character`、`../domain/lore`、`../domain/variable`、`./sqliteReferenceRepository`
- **集成方式**: runtime 只返回 `ReferenceRepository`，上层 store 通过 `getReferenceRepository()` 获取
- **配置来源**: 通过 `window.__TAURI_INTERNALS__` 判断运行环境

### 6. 技术选型理由

- **为什么用这个方案**: 与 `projectRepositoryRuntime` 完全同构，降低理解和维护成本
- **优势**: 调度层与数据访问层分离，测试时可直接注入 fake repository
- **劣势和风险**: volatile repository 仅存在内存中，刷新即丢失；但这是非 Tauri 环境的预期行为

### 7. 关键风险点

- **并发问题**: 当前 runtime 是单例级别，测试并行时必须显式 reset
- **边界条件**: 非 Tauri 环境不应误判为 SQLite；需严格沿用现有检测方式
- **性能瓶颈**: volatile Map 仅用于开发/测试，规模足够小，风险可接受
- **安全考虑**: 本任务不涉及安全控制变更
