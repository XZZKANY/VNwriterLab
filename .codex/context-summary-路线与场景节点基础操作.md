## 项目上下文摘要（路线与场景节点基础操作）

生成时间：2026-04-06  

### 1. 相似实现分析

- **实现1**: `src/features/projects/store/useProjectStore.ts`
  - 模式：Zustand + persist + `markDirty` / `markSaved`
  - 可复用：`createProject`、`createRoute`、`createSceneInRoute`
  - 需注意：项目结构变更要整体替换 `currentProject`，并保持自动保存状态一致
- **实现2**: `src/features/editor/store/useEditorStore.ts`
  - 模式：Zustand + persist 的场景/块状态中心
  - 可复用：`createScene`、`addBlock` 中的 `sortOrder` 追加规则
  - 需注意：场景内已有 `sortOrder` 语义，项目页与编辑页需要一致使用
- **实现3**: `src/features/editor/pages/EditorPage.tsx`
  - 模式：页面只负责透传 store 回调给 `SceneTree`
  - 可复用：`SceneTree` 作为最小入口组件的集成方式
  - 需注意：编辑页与项目页共享项目结构时，不能在 UI 层直接修改底层数据
- **实现4**: `src/features/characters/pages/CharactersPage.tsx`
  - 模式：按 `routeId` 过滤并按 `sortOrder` 展示场景
  - 可复用：验证场景移动后 `routeId` 与 `sortOrder` 是否正确更新
  - 需注意：排序字段是项目内已消费的真实数据，不是仅供展示

### 2. 项目约定

- **命名约定**：React 组件使用 PascalCase，store 钩子使用 `useXxxStore`，动作使用动词开头的 camelCase
- **文件组织**：feature 内聚，页面放在 `pages`，状态放在 `store`，通用域模型放在 `src/lib/domain`
- **导入顺序**：第三方库在前，本地模块在后，类型导入用 `import type`
- **代码风格**：函数组件 + hooks，尽量保持小函数和直接条件分支，不引入不必要抽象

### 3. 可复用组件清单

- `src/features/projects/store/useProjectStore.ts`：项目结构操作中心
- `src/features/editor/components/SceneTree.tsx`：场景树最小交互入口
- `src/features/projects/pages/ProjectHomePage.tsx`：项目页展示与路线入口
- `src/lib/domain/project.ts`：路线/场景工厂函数
- `src/lib/store/useAutoSaveStore.ts`：自动保存状态同步

### 4. 测试策略

- **测试框架**：Vitest + Testing Library + user-event
- **测试模式**：页面交互测试为主，必要时补 store 行为测试
- **参考文件**：`src/features/projects/pages/ProjectHomePage.test.tsx`、`src/features/editor/pages/EditorPage.test.tsx`
- **覆盖要求**：创建/重命名/移动的正常流程，首尾边界，跨路线移动后数量与顺序变化，空状态与无效输入

### 5. 依赖和集成点

- **外部依赖**：React、Zustand、Vitest、Testing Library
- **内部依赖**：`useProjectStore` 供项目页和编辑页共享项目结构；`SceneTree` 通过回调触发结构变化
- **集成方式**：UI 只发动作，数据变更由 store 统一处理并同步自动保存状态
- **配置来源**：`package.json` 中的 `test` / `build` 脚本

### 6. 技术选型理由

- **为什么用这个方案**：现有架构已经把项目结构收敛在 `useProjectStore`，新增操作最适合直接扩展 store
- **优势**：变更面小，项目页与编辑页保持同源数据，测试可以直接验证 UI 与 store 行为
- **劣势和风险**：需要谨慎重算 `sortOrder`，跨路线移动时要避免同一路线内顺序重复或跳号

### 7. 关键风险点

- **并发问题**：当前是前端单用户本地状态，主要风险是连续操作造成的顺序错乱，而不是并发冲突
- **边界条件**：首条/末条场景无法上移或下移，单场景路线移动后仍需保持该路线的连续排序
- **性能瓶颈**：路线和场景数量目前较小，直接 `map` / `filter` 重算可接受
- **安全考虑**：本次任务不新增安全边界，只需保证输入清洗与空值处理
