## 项目上下文摘要（V2 Step 2：store repository 驱动）

生成时间：2026-04-09 22:52:00

### 1. 相似实现分析

- **实现1**: `src/features/projects/store/useProjectStore.ts`
  - 模式：当前是 `zustand + persist` 的项目主 store，负责项目结构变更、autosave 与 editor 场景镜像同步。
  - 可复用：`projectSceneUtils.ts` 中的排序、归一化、跨路线迁移与 editor 同步 helper。
  - 需注意：`createProject / updateScene / deleteScene / moveScene*` 都会同时触发 `useEditorStore` 同步，不能在本轮破坏这条链。
- **实现2**: `src/features/characters/store/useCharacterStore.ts`
  - 模式：典型 `persist` store，动作内部执行 `markDirty -> set -> markSaved`，`onRehydrateStorage` 再调用 `markHydrated(restored)`。
  - 可复用：autosave 时序与 reset 模式。
  - 需注意：仓库里其他 store 仍然走 localStorage，本轮只切 project store，不能误扩到 characters/lore。
- **实现3**: `src/features/lore/store/useLoreStore.ts`
  - 模式：与 characters store 同构，说明仓库当前对本地持久化的统一约定是 `persist + autosave`。
  - 可复用：输入裁剪、目标项存在校验、最小状态更新。
  - 需注意：本轮若改 project store API 为异步，要评估页面/测试调用面。
- **实现4**: `src/lib/repositories/sqliteProjectRepository.ts`
  - 模式：repository 边界已经可运行，提供 `listProjects / getProject / createProject / updateProject`。
  - 可复用：项目创建、整项目重写保存、按 projectId 读取完整 routes/scenes/blocks。
  - 需注意：当前 adapter 未覆盖 editor 的 links/variables 主链，因此 Step 2 第一批只能先切 `useProjectStore`。

### 2. 项目约定

- **命名约定**: store/action 使用 camelCase，常量使用全大写下划线，测试描述使用简体中文。
- **文件组织**: `features/*/store` 放 Zustand store；`lib/repositories` 放持久化边界；`lib/store` 放 autosave / 持久化测试。
- **导入顺序**: 先第三方，再同层模块，再跨 feature/lib 模块；类型导入与值导入按现有文件风格混排。
- **代码风格**: 双引号、分号、TypeScript 显式接口；复杂纯逻辑优先抽到 helper。

### 3. 可复用组件清单

- `src/features/projects/store/projectSceneUtils.ts`：项目场景排序、归一化、跨路线迁移、同步 editor 场景。
- `src/lib/repositories/sqliteProjectRepository.ts`：project repository 的 SQLite adapter。
- `src/lib/store/useAutoSaveStore.ts`：`markDirty / markSaved / markHydrated / reset`。
- `src/lib/repositories/projectRepository.ts`：project repository contract。

### 4. 测试策略

- **测试框架**: Vitest + Testing Library。
- **参考文件**:
  - `src/lib/store/persistence.test.ts`
  - `src/features/projects/pages/ProjectHomePage.test.tsx`
  - `src/features/editor/pages/EditorPage.test.tsx`
  - `src/lib/repositories/sqliteProjectRepository.test.ts`
- **覆盖要求**:
  - project store 新增 repository 驱动测试：hydrate、create、route/scene 变更保存。
  - persistence 相关测试改为验证 repository 恢复，不再断言 `PROJECT_STORAGE_KEY`。
  - 维持现有 editor 镜像同步与 autosave 语义。

### 5. 依赖和集成点

- **外部依赖**: Zustand；repository 运行时最终接 SQLite adapter。
- **内部依赖**:
  - `useProjectStore` -> `useAutoSaveStore`
  - `useProjectStore` -> `useEditorStore`
  - `useProjectStore` -> `projectSceneUtils`
  - `useProjectStore` -> `ProjectRepository`
- **集成方式**: store action 中调用 repository，再同步内存状态；页面入口通过显式 hydrate action 拉起恢复。
- **配置来源**: 当前没有 project repository runtime provider，需要本轮新增。

### 6. 技术选型理由

- **为什么用这个方案**: Zustand 官方允许直接在 async action 中 `await` 外部数据源后再 `set`；这比继续依赖 `persist` 更符合 repository 驱动目标。
- **官方证据**:
  - Context7 `/pmndrs/zustand`：async action 推荐模式是在 action 中 `await` 外部源，再调用 `set`。
  - persist 文档只建议 `skipHydration + manual rehydrate` 用于仍基于 storage 的场景；本轮目标是从 localStorage 主路径切出，因此应改为显式 hydrate action，而不是继续依赖 `persist` 主责任。

### 7. 关键风险点

- **主风险1**: 若直接把 `useEditorStore` 一起切换，会越过 links/variables 尚未 repository 化的边界。
- **主风险2**: 若 project action 改异步，现有页面/测试需要等待状态稳定，否则会产生假失败。
- **主风险3**: 不能做 localStorage + repository 双写，否则回归边界失控。
- **主风险4**: `markHydrated(restored)` 触发时机将从 `persist` 自动回调改为显式 hydrate 完成时调用，需要保住“已恢复本地草稿”提示语义。
