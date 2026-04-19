## 项目上下文摘要（V1 场景进入条件）

生成时间：2026-04-06  

### 1. 相似实现分析

- **实现 1**: `src/features/preview/lib/previewEngine.ts`
  - 模式：纯函数预览引擎，负责条件判定、下一场景解析、选项副作用应用。
  - 可复用：`resolveVisibleBlocks`、`resolveNextSceneId`、`applyChoiceEffect`。
  - 需注意：当前条件判定只读取 `variable.defaultValue`，还没有场景进入层的阻止逻辑。
- **实现 2**: `src/features/editor/store/conditionBlock.ts`
  - 模式：`metaJson` 解析 / 序列化工具，字段默认值兜底清晰。
  - 可复用：`parseConditionBlockMeta`、`stringifyConditionBlockMeta` 的轻量协议。
  - 需注意：只支持 `isTrue` 与 `gte`，适合 V1 最小条件语义。
- **实现 3**: `src/features/preview/pages/PreviewPage.tsx`
  - 模式：页面只消费 store 和预览纯函数，运行态通过局部 `useState` 维护。
  - 可复用：`startFromBeginning`、`startFromCurrentScene`、点击选项推进的事件流。
  - 需注意：运行时变量必须留在页面局部状态，不能写回 `useEditorStore`。
- **实现 4**: `src/features/preview/pages/PreviewPage.test.tsx`
  - 模式：页面级交互测试，直接构造 store 状态并驱动真实点击流程。
  - 可复用：用 `useEditorStore.setState` 搭建预览数据、用 `userEvent` 验证路径。
  - 需注意：当前测试已覆盖选项跳转、条件隐藏选项、选项副作用。
- **实现 5**: `src/lib/domain/scene.ts`
  - 模式：Scene 领域模型只定义基础结构，没有预留场景级条件字段。
  - 可复用：`Scene.blocks` 作为场景内容和入口条件的唯一载体。
  - 需注意：V1 最小方案不扩展 Scene 持久化模型，优先复用场景开头的条件块语义。

### 2. 项目约定

- **命名约定**: 代码标识符使用英文 `camelCase` / `PascalCase`，界面文案与测试描述使用简体中文。
- **文件组织**: 领域模型在 `src/lib/domain`，feature 内逻辑分别放在 `store`、`lib`、`pages`。
- **导入顺序**: 先第三方，再本地领域类型，再 feature 内工具，保持现有相对路径风格。
- **代码风格**: 优先纯函数、小型 action、局部状态，避免引入 service 层或复杂抽象。

### 3. 可复用组件清单

- `src/features/editor/store/conditionBlock.ts`: 条件块 meta 协议参考。
- `src/features/preview/lib/previewEngine.ts`: 预览判定入口。
- `src/features/preview/pages/PreviewPage.tsx`: 场景进入与切换的页面接线入口。
- `src/features/preview/pages/PreviewPage.test.tsx`: 页面交互测试模板。
- `src/lib/domain/variable.ts`: 变量与条件运算符定义。

### 4. 测试策略

- **测试框架**: Vitest + Testing Library。
- **测试模式**: 页面交互测试 + 纯函数单测优先，必要时补充辅助函数测试。
- **参考文件**: `src/features/preview/pages/PreviewPage.test.tsx`、`src/lib/store/persistence.test.ts`。
- **覆盖要求**:
  - 运行时变量为 0 时，目标场景进入应被阻止。
  - 运行时变量在预览过程中被选项副作用改变后，后续场景应可进入。
  - 运行时变量不能写回 `useEditorStore`。

### 5. 依赖和集成点

- **外部依赖**: `react`、`zustand`、`vitest`、`@testing-library/react`、`@testing-library/user-event`。
- **内部依赖**:
  - `useEditorStore` 提供场景、连线和默认变量。
  - `previewEngine` 提供纯函数判定。
  - `PreviewPage` 持有运行时变量快照和进入阻止状态。
- **集成方式**: 仍然是页面消费 store，纯函数负责业务判定，不新增并行状态系统。
- **配置来源**: `package.json` 的 `test` / `build` 脚本和 `vitest.config.ts`。

### 6. 技术选型理由

- **为什么用这个方案**: 场景模型没有额外条件字段，直接复用场景开头条件块是改动最小、风险最低的方案。
- **优势**: 不扩展持久化数据结构，不改编辑器状态边界，能直接沿用现有条件解析与测试模式。
- **劣势和风险**: 只覆盖 V1 最小闭环，不支持复杂条件组、表达式树或运行态持久化。

### 7. 关键风险点

- **边界条件**: 只能把场景开头连续条件块视为进入条件，不能误伤普通叙事块。
- **状态边界**: 阻止进入时只能停留在预览组件局部状态，不能污染编辑器 store。
- **验证缺口**: 需要补一条明确测试，证明“默认值”与“运行时值”不是同一来源。
- **未来扩展**: 若后续要支持更复杂的场景条件，需要再抽出统一 evaluator。