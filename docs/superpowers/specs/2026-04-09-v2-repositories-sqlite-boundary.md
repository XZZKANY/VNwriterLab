# V2 起点：repositories / SQLite 边界决策

## 目标

基于当前代码真实调用链，明确 SQLite 是否已经进入前端主运行时路径，并给出下一阶段最小可执行收敛顺序。

## 当前事实

1. `src/lib/repositories/*.ts` 目前只有接口，没有实现，也没有任何业务消费方。
2. `src/lib/db/database.ts` 只有 `DATABASE_URL` 与 `getDatabase()`；在 `src/**` 中没有实际读写调用。
3. `src-tauri/src/lib.rs` 与 `src-tauri/src/migrations.rs` 已注册 SQL plugin 和建表 migration，但这只证明基础设施存在。
4. 当前实际运行主链仍是：feature stores → Zustand `persist` → localStorage。

## 不做的事

- 不在本轮把 `useProjectStore` / `useEditorStore` / `useCharacterStore` / `useLoreStore` 直接改成 SQLite 双写。
- 不绕过 `src/lib/repositories`，直接在 store 中拼 SQL。
- 不在没有 hydration/save contract 的情况下强推“去 localStorage”。

## 决策

### V2 Step 1：先让 repositories 变成可运行边界

- 为 `ProjectRepository`、`StoryRepository`、`ReferenceRepository` 提供 SQLite adapter。
- adapter 负责：`Database.load`、`select/execute`、domain ↔ row 转换、最小 CRUD 验证。
- 在这一阶段，store 仍可继续作为 UI 主状态容器，但不再新增 localStorage-only 的新持久化责任。

### V2 Step 2：再让 stores 切到 repository 驱动

- 先定义 `hydrate / save / reset` 契约。
- 先迁移 `useProjectStore` 与 `useEditorStore` 主链，再扩展到 characters/lore。
- 以“单条主链切换 + 本地验证通过”为节奏逐步移除 `persist` 主责任。

## 为什么这样做

- 这与当前代码现实一致：SQLite 基础设施已存在，但前端消费层完全缺位。
- 先补 adapter 可以避免把 SQL 细节散落进 store。
- 先切边界再切主路径，回归范围最小，也更适合现有测试体系。

## 验证出口

- `ProjectRepository` / `StoryRepository` / `ReferenceRepository` 各自至少有最小 CRUD 或读写闭环验证。
- 首条被切换的 store 必须通过“加载、编辑、保存、重载恢复”本地验证。
