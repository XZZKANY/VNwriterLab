# 状态层 slice 化重构设计

## 目标

在不改变页面调用方式、repository runtime 合约和 autosave 语义的前提下，将 `useEditorStore` 与 `useProjectStore` 从超大实现文件重构为“单一对外入口 + 多个内部 slice”的结构，优先降低状态层复杂度与认知负担。

## 范围

- 保留 `useEditorStore` 与 `useProjectStore` 作为唯一对外入口。
- 在 `editor/store` 与 `projects/store` 下新增 `slices/` 子目录。
- 将两个大 store 的内部实现按职责拆分为多个 slice 文件。
- 保持现有 action 名称、selector 用法、repository runtime 接口与 `useAutoSaveStore` 调用语义不变。
- 更新定向测试与必要的集成测试，证明行为未变化。

## 非目标

- 不引入新的状态管理库。
- 不重做 repository 架构，不调整 `getProjectRepository`、`getStoryRepository`、`getReferenceRepository` 合约。
- 不把页面层 hydrate 逻辑一起迁移为自定义 Hook。
- 不顺手做跨 feature 的共享状态框架。
- 不为了抽象而新增 `actions/`、`effects/`、`state/` 多层目录。

## 选定方案

采用“内部 slice 化，但对外 API 不变”的方案。

### 选型理由

1. 相比继续抽 helper，该方案能显著缩短主 store 文件，并把状态、动作和恢复逻辑按领域拆开。
2. 相比引入额外 orchestration/service 层，该方案风险更低，适合本轮“先降复杂度”的目标。
3. 该方案与 Zustand 官方 slices pattern 一致，后续若继续演进到更强的测试隔离或扩展边界，也不需要推翻当前设计。

## `useEditorStore` 设计

### slice 划分

- `editorHydrationSlice`
  - 负责 `hydrateScenes(projectId)`、`hydrateVariables(projectId)`、`resetEditor()`。
- `editorSceneSlice`
  - 负责 `scenes`、`selectedSceneId`、`createScene`、`importScene`、`selectScene`、`updateScene`、`deleteScene`。
- `editorVariableSlice`
  - 负责 `variables`、`selectedVariableId`、`createVariable`、`selectVariable`、`deleteVariable`、`updateVariable`。
- `editorBlockSlice`
  - 负责 `addBlock`、`deleteBlock`、`moveBlockUp`、`moveBlockDown`、`updateBlockContent`、`updateConditionBlock`、`updateNoteBlock`。
- `editorChoiceLinkSlice`
  - 负责 `links` 与 `updateChoiceBlock`，集中处理 choice 与 links 的联动。

### 边界原则

- “谁是主语，谁负责副作用”。
- 删除变量时对 condition/choice 引用的清理，仍由 `editorVariableSlice` 负责。
- 删除场景时对 links 与 choice target 的清理，仍由 `editorSceneSlice` 负责。
- 更新 choice 并重建 links，统一由 `editorChoiceLinkSlice` 负责。
- `choiceBlock.ts`、`conditionBlock.ts`、`noteBlock.ts`、`linkUtils.ts`、`editorSceneUtils.ts` 保持原位复用。

## `useProjectStore` 设计

### slice 划分

- `projectHydrationSlice`
  - 负责 `currentProject` 与 `hydrateLatestProject()`。
- `projectLifecycleSlice`
  - 负责 `createProject`、`resetProject`。
- `projectRouteSlice`
  - 负责 `createRoute`、`renameRoute`。
- `projectSceneSlice`
  - 负责 `createSceneInRoute`、`updateScene`、`deleteScene`、`moveSceneUp`、`moveSceneDown`、`moveSceneToRoute`。

### 边界原则

- `currentProject` 继续作为整个 store 的共享核心状态，不拆散为多个状态对象。
- `replaceEditorScenesFromProject`、`hydrateEditorStateFromProject`、`saveProjectSnapshot`、`saveStorySceneSnapshot`、`deleteStorySceneSnapshot` 保留为内部共享编排逻辑，不提升为新的公开 slice。
- `projectSceneUtils.ts` 保持原位复用，继续承载项目场景排序、归一化、跨路线迁移与 editor 同步 helper。

## 文件结构与命名

### editor 侧

```text
src/features/editor/store/
├── useEditorStore.ts
├── editorStore.types.ts            # 仅在组合类型明显过长时新增
├── editorSceneUtils.ts
├── choiceBlock.ts
├── conditionBlock.ts
├── noteBlock.ts
├── linkUtils.ts
└── slices/
    ├── editorHydrationSlice.ts
    ├── editorSceneSlice.ts
    ├── editorVariableSlice.ts
    ├── editorBlockSlice.ts
    └── editorChoiceLinkSlice.ts
```

### project 侧

```text
src/features/projects/store/
├── useProjectStore.ts
├── projectStore.types.ts           # 仅在组合类型明显过长时新增
├── projectSceneUtils.ts
└── slices/
    ├── projectHydrationSlice.ts
    ├── projectLifecycleSlice.ts
    ├── projectRouteSlice.ts
    └── projectSceneSlice.ts
```

### 命名规则

- slice 文件统一使用 `xxxSlice.ts`。
- 组合入口仍为 `useEditorStore.ts`、`useProjectStore.ts`。
- `*.types.ts` 仅在多 slice 共享同一组类型、且主入口类型明显过长时才引入。
- 现有稳定纯工具文件不迁移、不重命名。

## 实施顺序

1. 先重构 `useProjectStore`，验证“入口不变 + 内部 slice 化”模式可行。
2. 再重构 `useEditorStore`，并分两批推进：
   - 第一批：`editorHydrationSlice`、`editorSceneSlice`、`editorVariableSlice`
   - 第二批：`editorBlockSlice`、`editorChoiceLinkSlice`
3. 每一批完成后先跑定向测试，再继续下一批。
4. 所有 slice 化完成后，统一做一次全量测试与构建验证。

## 数据流与副作用约束

- 对外 API 不变：action 名称、selector 用法、页面调用方式保持原样。
- slice 内状态读写仍只通过 Zustand 的 `set` / `get` 完成，不引入额外 dispatcher、事件总线或状态机。
- `useAutoSaveStore` 的 `markDirty -> set -> markSaved` 与 `markHydrated` 语义保持不变。
- repository runtime 合约保持不变，状态层只重组内部实现，不顺手重做持久化层。
- 重构阶段不改变副作用时序；若未来需要优化保存节流或批处理，应作为独立任务设计。

## 测试与验证

### `useProjectStore` 重构后

- `npm run test -- src/features/projects/store/useProjectStore.repository.test.ts src/features/projects/pages/ProjectHomePage.test.tsx src/lib/store/persistence.test.ts`

### `useEditorStore` 第一批重构后

- `npm run test -- src/features/editor/store/useEditorStore.variablesRepository.test.ts src/features/editor/store/useEditorStore.scenesRepository.test.ts src/features/editor/pages/EditorPage.test.tsx src/lib/store/persistence.test.ts`

### `useEditorStore` 第二批重构后

- `npm run test -- src/features/editor/pages/EditorPage.test.tsx src/features/graph/pages/GraphPage.test.tsx src/features/preview/pages/PreviewPage.test.tsx src/lib/store/persistence.test.ts`

### 最终门禁

- `npm run test`
- `npm run build`

## 风险与控制

- 风险：重构中无意改变 action 名称或 selector 字段。
  - 控制：明确要求对外 API 不变，主入口文件只负责组合 slice。
- 风险：副作用顺序变化导致 autosave、snapshot 或 editor 同步语义漂移。
  - 控制：本轮只做结构重组，不做时序优化。
- 风险：`useEditorStore` 的 block / choice / links 联动被拆散后更难追踪。
  - 控制：按“主语负责副作用”归属规则设计 slice，并将该批放在最后实施。
- 风险：当前工作区已有未提交改动，被重构过程误覆盖。
  - 控制：只修改目标 store 及其新增 slice 文件，每阶段先检查 diff 再继续。

## 验收标准

- `useEditorStore.ts` 与 `useProjectStore.ts` 显著缩短，并转为组合入口。
- 内部逻辑按既定 slice 边界落入独立文件。
- 页面调用方式、repository runtime 合约、autosave 语义保持不变。
- 定向测试通过。
- `npm run test` 与 `npm run build` 通过。
