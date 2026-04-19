# V2 Step 3：characters / lore store repository 驱动设计

## 1. 目标

在 `useProjectStore` 完成 repository 驱动之后，继续把 `useCharacterStore` 与 `useLoreStore` 从 `persist + localStorage` 主恢复链迁移到 repository 驱动。

本轮目标不是扩大架构面，而是沿用上一轮已经验证通过的模式：

- repository 负责持久化边界
- store 继续负责 UI 状态编排
- 页面只负责在合适时机触发 hydrate

这样可以让角色与设定数据不再依赖浏览器侧 localStorage 作为主恢复来源，同时保持现有页面交互与 autosave 语义不变。

## 2. 范围收敛

### 2.1 本轮纳入范围

- 新增 `referenceRepositoryRuntime` 运行时 provider
- `useCharacterStore` 新增 repository 驱动的 hydrate/save 契约
- `useLoreStore` 新增 repository 驱动的 hydrate/save 契约
- 角色页与设定页在当前项目存在时显式触发 hydrate
- 补齐 repository 驱动测试、页面恢复测试与 persistence 回归测试

### 2.2 本轮明确不做

- 不迁移 `variables`
- 不迁移 `useEditorStore`
- 不修改角色页或设定页的 UI 结构
- 不引入 localStorage + repository 双写
- 不扩到多项目切换管理或缓存层
## 3. 当前事实与依赖边界

### 3.1 当前事实

- `useProjectStore` 已经具备 `hydrateLatestProject`，并通过 `projectRepositoryRuntime` 切到 repository 驱动
- `useCharacterStore` 与 `useLoreStore` 当前仍是 Zustand `persist` store
- `sqliteReferenceRepository.ts` 已具备角色、设定、变量的 list/save 能力
- 角色页与设定页当前依赖 `useProjectStore.getState().currentProject` 判断是否允许编辑

### 3.2 本轮依赖

- `src/lib/repositories/referenceRepository.ts`：既有 reference repository 契约
- `src/lib/repositories/sqliteReferenceRepository.ts`：真实 SQLite adapter
- `src/lib/store/useAutoSaveStore.ts`：继续复用 `markDirty / markSaved / markHydrated / reset`
- `src/features/projects/store/useProjectStore.ts`：继续作为当前 project 的真实来源

### 3.3 边界原则

- repository 负责从 `projectId` 读写角色与设定
- store 不直接接触 SQL
- 页面不拼接持久化逻辑，只在需要时触发 hydrate
- 变量仍留在现有链路中，不在本轮混入

## 4. 方案比较

### 方案 A：角色与设定一起迁移【推荐】

做法：

- 新增 `referenceRepositoryRuntime`
- 同时为 `useCharacterStore` 与 `useLoreStore` 新增 hydrate/save
- 同步修正页面恢复测试与 persistence 测试

优点：

- 与 `sqliteReferenceRepository` 的职责天然一致
- 可以一次稳定运行时边界
- 与上一轮 project store 改造节奏一致

缺点：

- 本轮回归面会覆盖两个页面和持久化测试

### 方案 B：先切角色，再切设定

优点：

- 改动面更小
- 单次排错更简单

缺点：

- `referenceRepositoryRuntime` 价值要分两轮才能显现
- 会重复调整相似测试与恢复链
### 方案 C：角色、设定、变量一起切换

优点：

- reference repository 一次收口更完整

缺点：

- 会把变量与 editor 相关链路拉进来
- 超出当前安全边界，回归风险明显上升

### 结论

采用方案 A。先把 `characters + lore` 一起切到 repository 驱动，暂不碰 variables。

## 5. 设计方案

### 5.1 新增 runtime provider

新增：`src/lib/repositories/referenceRepositoryRuntime.ts`

职责：

- 暴露 `getReferenceRepository()`
- 支持测试注入 fake repository
- 在真实 Tauri 环境下回落到 `createSqliteReferenceRepository()`
- 在非 Tauri 环境下回落到 volatile repository，避免测试环境误触 SQLite runtime

这与上一轮 `projectRepositoryRuntime` 的角色一致，保证运行时选择与测试注入都收敛在 repository 边界。

### 5.2 useCharacterStore 改造

`useCharacterStore` 将移除角色数据对 `persist` 的主恢复责任，并新增显式 hydrate action。

建议新增：

- `hydrateCharacters(projectId: string): Promise<void>`
- `createCharacter(projectId: string)` 内改为更新内存后保存到 repository
- `updateCharacter(characterId, input)` 内改为更新内存后保存到 repository

语义保持不变：

- 仍使用 `markDirty / markSaved`
- 仍保留 `selectedCharacterId`
- 仍保持“没有当前项目时不可创建角色”的页面行为

### 5.3 useLoreStore 改造

`useLoreStore` 采用和角色 store 对称的方式：

- `hydrateLoreEntries(projectId: string): Promise<void>`
- `createLoreEntry(projectId: string)` 改为 repository 保存
- `updateLoreEntry(entryId, input)` 改为 repository 保存

语义保持不变：

- 仍保留 `selectedLoreId`
- 仍使用 autosave 标记
- 仍以当前 project 为边界加载与保存
### 5.4 页面恢复链

- `CharactersPage.tsx`：当 `currentProject` 已存在且角色列表为空时，触发 `hydrateCharacters(currentProject.id)`
- `LorePage.tsx`：当 `currentProject` 已存在且设定列表为空时，触发 `hydrateLoreEntries(currentProject.id)`

要求：

- hydrate 触发要稳定，避免 render 抖动导致重复调用
- 页面不新增额外 loading 协议；仍沿用当前最小展示模式
- 如果 repository 中没有数据，应明确标记为“未恢复草稿”或空结果，而不是残留旧状态

### 5.5 持久化回归策略

本轮 persistence 测试要从“localStorage 是否写入角色/设定 store”转为“repository 是否成为主恢复链”。

保留：

- editor store、变量、条件块等仍可继续验证其当前持久化语义

调整：

- 角色重载恢复测试改为注入 fake reference repository
- 设定重载恢复测试改为注入 fake reference repository
- 页面恢复测试改为先 hydrate 当前 project，再验证角色页/设定页能恢复详情

## 6. 关键文件

- `src/lib/repositories/referenceRepositoryRuntime.ts`
- `src/lib/repositories/referenceRepository.ts`
- `src/lib/repositories/sqliteReferenceRepository.ts`
- `src/features/characters/store/useCharacterStore.ts`
- `src/features/lore/store/useLoreStore.ts`
- `src/features/characters/pages/CharactersPage.tsx`
- `src/features/lore/pages/LorePage.tsx`
- `src/features/characters/pages/CharactersPage.test.tsx`
- `src/features/lore/pages/LorePage.test.tsx`
- `src/lib/store/persistence.test.ts`

## 7. 风险与控制

- 如果 characters/lore hydrate 不按 `projectId` 过滤，可能出现跨项目串数据，因此 repository 读取必须显式依赖当前项目 ID。
- 如果页面每次 render 都触发 hydrate，会造成重复请求和测试不稳定，因此必须在 effect 条件中收敛触发时机。
- 如果在非 Tauri 环境直接使用 SQLite adapter，会让测试环境依赖真实 runtime，因此 runtime provider 必须保留 volatile fallback。
- 如果本轮把 variables 一起迁移，会连带影响 editor store 和条件块链路，超出当前回归控制范围，因此明确不纳入。
## 8. 验证策略

至少执行以下验证：

- `npm.cmd test -- src/features/characters/pages/CharactersPage.test.tsx src/features/lore/pages/LorePage.test.tsx`
- `npm.cmd test -- src/lib/store/persistence.test.ts`
- 如新增 store 级 repository 测试，则一并执行对应测试文件
- `npm.cmd test`
- `npm.cmd run build`

验证重点：

- repository 驱动的 hydrate 是否稳定
- create/update 是否仍保持 autosave 语义
- 页面重载后是否能恢复角色/设定详情
- 当前 project 不存在时页面行为是否不被破坏

## 9. 验收结论

当以下条件同时满足时，本设计视为完成：

- `useCharacterStore` 与 `useLoreStore` 已具备 repository 驱动的 hydrate/save 契约
- `referenceRepositoryRuntime` 已建立并可供测试注入 fake repository
- 角色页与设定页在当前 project 已恢复的前提下可稳定恢复详情
- persistence 回归、全量测试与构建全部通过
- variables 与 editor 主链未被误扩到本轮改动范围
