# V2 Step 4：editor variables repository 驱动设计

## 1. 目标

在 project、characters、lore 已经切到 repository 驱动之后，本轮只把 editor 中的变量主链切到 `ReferenceRepository`。

本轮目标是让变量具备显式 `hydrate / save` 契约，优先收口条件块与选项副作用依赖的数据源；暂不迁移 editor scenes、blocks、links，避免把回归面一次性扩大到整个编辑器。

## 2. 范围

### 本轮纳入

- `useEditorStore` 新增 `hydrateVariables(projectId)`
- `createVariable / updateVariable / deleteVariable` 改为通过 reference repository 保存变量快照
- `EditorPage` 在当前 project 存在且项目变量为空时显式触发 hydrate
- 补 store 级变量 repository 测试、页面恢复测试、persistence 回归

### 本轮不做

- 不迁移 scenes / blocks / links 到 repository
- 不修改 preview、graph 或条件块协议
- 不重构 `ReferenceRepository` 接口
- 不删除 editor store 的 scene/block/link localStorage 现状

## 3. 架构

- 继续复用 `src/lib/repositories/referenceRepositoryRuntime.ts`
- store 只通过 `getReferenceRepository()` 调用 `listVariables / saveVariable`
- 页面只触发 `hydrateVariables(currentProject.id)`
- 变量删除仍由 `useEditorStore` 负责同步清理条件块与选项副作用引用

## 4. 风险控制

- hydrate 必须按 `projectId` 过滤，避免跨项目变量串线
- 删除变量后，repository 没有 deleteVariable 接口，本轮采用保存剩余变量快照会受限；因此需要扩展 reference repository 契约或接受 deleted variable 暂无法从 SQLite 删除。为保证闭环，本轮将最小扩展 `saveVariables(projectId, variables)`，并让 runtime / sqlite adapter 支持按 project 重写变量集合
- 不触碰 scenes/blocks/links，避免破坏编辑器内容持久化

## 5. 验收标准

- `hydrateVariables` 能从 fake repository 恢复变量并设置选中项
- create/update/delete 变量后 repository 收到当前 project 的变量快照
- EditorPage 能在 current project 已恢复时自动显示 repository 中的变量
- 定向测试、全量测试、构建全部通过
