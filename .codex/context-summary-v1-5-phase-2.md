## 项目上下文摘要（V1.5 第二批）

生成时间：2026-04-06 01:47:10

### 1. 相似实现分析

- **实现1**: `src/features/editor/store/useEditorStore.ts`
  - 模式：Zustand `persist` + store 内原子更新
  - 可复用：块排序、条件更新、变量更新、`markDirty` / `markSaved`
  - 需注意：编辑器数据是预览与图页的真实来源之一

- **实现2**: `src/features/projects/store/useProjectStore.ts`
  - 模式：项目结构变更集中在 store，并在必要时同步到 editor store
  - 可复用：路线重命名、场景排序、跨路线移动后的同步策略
  - 需注意：结构语义如 `sortOrder`、`isStartScene` 应优先由项目 store 维护

- **实现3**: `src/features/graph/lib/graphData.ts`
  - 模式：纯函数生成图节点、边和条件摘要
  - 可复用：基于 `scenes` / `links` 的派生数据构建
  - 需注意：图页展示应在派生层过滤，不应反向污染底层数据

### 2. 项目约定

- **命名约定**: store action 使用动词式 camelCase，组件使用 PascalCase，类型导入优先 `import type`
- **文件组织**: feature 内聚，页面、组件、store、lib 在 feature 内收拢
- **导入顺序**: 先第三方，再 domain/store/lib，本项目广泛使用相对路径
- **代码风格**: 受控组件 + store 回调，避免额外状态层

### 3. 可复用组件清单

- `src/features/editor/store/useEditorStore.ts`
- `src/features/projects/store/useProjectStore.ts`
- `src/features/editor/components/SceneTree.tsx`
- `src/features/graph/lib/graphData.ts`
- `src/lib/store/useAutoSaveStore.ts`

### 4. 测试策略

- **测试框架**: Vitest + Testing Library
- **测试模式**: 页面交互测试 + 纯函数测试 + 持久化恢复测试
- **参考文件**:
  - `src/features/editor/pages/EditorPage.test.tsx`
  - `src/features/graph/pages/GraphPage.test.tsx`
  - `src/lib/store/persistence.test.ts`
- **覆盖要求**: 正常流程、删除清理、排序修正、筛选结果、持久化恢复

### 5. 依赖和集成点

- **外部依赖**: React、Zustand、react-router-dom、reactflow、Vitest
- **内部依赖**: `project` 与 `editor` 双 store，`graph` 消费 editor store 的派生结果
- **集成方式**: 页面触发 store action，图页使用纯函数构建派生视图
- **配置来源**: 本地 `persist` 存储

### 6. 技术选型理由

- **为什么用这个方案**: 与当前仓库风格一致，最小化改动面
- **优势**: 状态源清晰，测试容易补，避免过早架构升级
- **劣势和风险**: 双 store 同步仍需谨慎，删除逻辑容易遗漏边界

### 7. 关键风险点

- **同步问题**: 场景元信息和删除动作若只改一侧 store，会导致项目页、图页、预览页结果不一致
- **边界条件**: 删除最后一个场景、删除起始场景、删除被连向的场景
- **性能瓶颈**: 当前数据量很小，主要是可维护性风险，不是算力瓶颈
- **安全考虑**: 本批不涉及新增安全能力
