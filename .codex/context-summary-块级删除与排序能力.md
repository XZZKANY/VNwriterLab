## 项目上下文摘要（块级删除与排序能力）

生成时间：2026-04-06  
来源：`docs/superpowers/plans/2026-04-06-v1-5-phase-1.md`、`src/features/editor/store/useEditorStore.ts`、`src/features/editor/components/SceneBlockList.tsx`、`src/features/editor/pages/EditorPage.tsx`、`src/features/editor/pages/EditorPage.test.tsx`、`src/features/projects/store/useProjectStore.ts`、`src/lib/store/useAutoSaveStore.ts`、`src/features/editor/store/choiceBlock.ts`、`src/features/editor/store/conditionBlock.ts`、`src/features/editor/components/SceneTree.tsx`、`src/lib/domain/block.ts`、`src/lib/domain/scene.ts`、`src/lib/domain/project.ts`

### 1. 相似实现分析

- **实现1**: `src/features/projects/store/useProjectStore.ts`
  - 模式：Zustand + `persist` + `markDirty`/`markSaved`
  - 可复用：状态变更前后统一标记自动保存
  - 需注意：新增、重排类操作应在 store 内一次性完成，避免视图层直接改数组
- **实现2**: `src/lib/store/useAutoSaveStore.ts`
  - 模式：独立自动保存状态 store，`persist` 仅保留必要字段
  - 可复用：保存状态与业务 store 解耦，编辑器操作后同步状态即可
  - 需注意：任何会修改 editor 内容的动作都应继续调用 `markDirty`/`markSaved`
- **实现3**: `src/features/editor/components/ChoiceBlockEditor.tsx` / `src/features/editor/components/ConditionBlockEditor.tsx`
  - 模式：纯受控组件，通过 `onChange` 向上回传，不持有本地业务状态
  - 可复用：块列表新增删除/排序按钮后，也应保持单向数据流
  - 需注意：块列表不要引入本地排序缓冲或拖拽态

### 2. 项目约定

- **命名约定**: React 组件使用 PascalCase，store action 使用动词式 camelCase，常量使用 `UPPER_SNAKE_CASE`
- **文件组织**: feature 内聚，editor 的 store、组件、页面、测试都放在 `src/features/editor` 下
- **导入顺序**: 第三方库在前，内部模块在后；类型导入与运行时代码并列但保持清晰分组
- **代码风格**: 直接、显式、少抽象，状态变更集中在 store，UI 组件尽量只负责渲染和触发回调

### 3. 可复用组件清单

- `src/features/editor/store/useEditorStore.ts`: 场景、变量、块的核心状态入口
- `src/features/editor/components/SceneBlockList.tsx`: 当前块渲染与编辑回调入口
- `src/features/editor/pages/EditorPage.tsx`: 页面级 action 透传与布局入口
- `src/features/editor/pages/EditorPage.test.tsx`: 编辑器端到端式定向测试样式
- `src/lib/store/useAutoSaveStore.ts`: 自动保存状态同步模式
- `src/lib/domain/block.ts`: `SceneBlock` 结构与 `sortOrder` 字段定义
- `src/lib/domain/scene.ts`: `Scene` 结构与 `blocks: SceneBlock[]`

### 4. 测试策略

- **测试框架**: Vitest + Testing Library + userEvent
- **测试模式**: 以页面级交互测试为主，直接通过 store 和页面组合验证
- **参考文件**: `src/features/editor/pages/EditorPage.test.tsx`
- **覆盖要求**: 新增块级删除、上移、下移的行为测试，覆盖删除后数组顺序和重排后 sortOrder

### 5. 依赖和集成点

- **外部依赖**: React、Zustand、Vitest、Testing Library
- **内部依赖**: `useEditorStore` 负责持久化编辑状态，`SceneBlockList` 负责块操作入口，`EditorPage` 负责透传动作
- **集成方式**: 受控组件把用户操作回传到 store，store 更新后驱动页面刷新
- **配置来源**: `persist` 配置在 `useEditorStore.ts` 中，自动保存同步依赖 `useAutoSaveStore`

### 6. 技术选型理由

- **为什么用这个方案**: 现有编辑器已经采用 store 驱动和受控组件模式，新增删除/排序最小代价是扩展 store action 并在列表组件加按钮
- **优势**: 不引入拖拽库，逻辑集中，可测试性强，兼容现有自动保存模式
- **劣势和风险**: 需要谨慎处理边界位置的上移/下移按钮状态，以及删除后的 `sortOrder` 重编号一致性

### 7. 关键风险点

- **并发问题**: 当前任务主要是单用户本地状态，不涉及并发写入，但仍需避免多次连续点击导致越界
- **边界条件**: 第一个块不能上移，最后一个块不能下移，删除后剩余块需要连续重排
- **性能瓶颈**: 块列表通常较短，数组重建成本可接受；实现上优先清晰而非过度优化
- **安全考虑**: 该任务不涉及新增安全逻辑
