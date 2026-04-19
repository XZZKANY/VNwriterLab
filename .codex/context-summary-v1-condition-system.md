## 项目上下文摘要（V1 基础条件 / 标记系统）

生成时间：2026-04-05 00:20:00

### 1. 相似实现分析

- **实现 1**: `src/features/editor/store/useEditorStore.ts`
  - 模式：单一 Zustand store + `persist` 持久化，页面只触发 action。
  - 可复用：`addBlock`、`updateChoiceBlock`、`partialize`、`onRehydrateStorage`。
  - 需注意：编辑器状态已经持久化 `variables` 字段，新增变量能力应直接落在这里。
- **实现 2**: `src/features/editor/components/ChoiceBlockEditor.tsx` + `src/features/editor/store/choiceBlock.ts`
  - 模式：`metaJson` 解析成受控字段，由子编辑器回调统一更新 store。
  - 可复用：`parse*Meta` / `stringify*Meta` 的轻量工具模式。
  - 需注意：条件块应沿用相同模式，避免把解析逻辑散落到页面。
- **实现 3**: `src/features/preview/pages/PreviewPage.tsx` + `src/features/preview/lib/previewEngine.ts`
  - 模式：页面消费 store，纯函数负责最小预览决策。
  - 可复用：`resolveNextSceneId` 与“页面只负责渲染和跳转”的边界。
  - 需注意：条件生效应优先补在纯函数层，而不是塞进页面事件。
- **实现 4**: `src/features/characters/pages/CharactersPage.tsx`
  - 模式：当前项目上下文 + 左侧列表 / 右侧详情的轻量编辑页。
  - 可复用：最小资料管理区结构。
  - 需注意：变量管理不需要新路由，可直接嵌入编辑页。
- **实现 5**: `src/features/lore/pages/LorePage.tsx`
  - 模式：依赖当前项目过滤列表，并在详情区直接更新 store。
  - 可复用：`create/select/update` 的页面接线方式。
  - 需注意：保持 V1 轻量，不引入搜索、筛选或复杂关联。

### 2. 项目约定

- **命名约定**: 标识符使用英文 `camelCase` / `PascalCase`，界面文案和测试描述使用简体中文。
- **文件组织**: 领域模型位于 `src/lib/domain`，feature 内的页面 / 组件 / store / lib 各自内聚。
- **导入顺序**: 先第三方，再本地领域类型或工具，保持既有相对路径风格。
- **代码风格**: 优先小型 action、纯函数和受控组件；避免新增 service/repository 层。

### 3. 可复用组件清单

- `src/features/editor/store/useEditorStore.ts`: 编辑器状态源与持久化入口。
- `src/features/editor/store/choiceBlock.ts`: block meta 解析/序列化模式参考。
- `src/features/editor/components/ChoiceBlockEditor.tsx`: 受控 block 编辑器参考。
- `src/features/preview/lib/previewEngine.ts`: 预览纯函数入口。
- `src/features/characters/pages/CharactersPage.tsx`: 最小资料管理 UI 结构参考。
- `src/features/lore/pages/LorePage.tsx`: 当前项目过滤 + 详情编辑模式参考。

### 4. 测试策略

- **测试框架**: Vitest + Testing Library。
- **测试模式**: 页面交互测试 + store 持久化恢复测试。
- **参考文件**:
  - `src/features/editor/pages/EditorPage.test.tsx`
  - `src/features/preview/pages/PreviewPage.test.tsx`
  - `src/lib/store/persistence.test.ts`
- **覆盖要求**:
  - 正常流程：变量创建、条件编辑、预览显示可用选项。
  - 边界条件：未满足条件时隐藏选项；无条件选项不受影响。
  - 恢复流程：变量与条件块在重载后恢复。

### 5. 依赖和集成点

- **外部依赖**: `zustand`、`react`、`@testing-library/react`、`vitest`。
- **内部依赖**:
  - 编辑页消费 `useProjectStore` 提供当前项目上下文。
  - 预览页消费 `useEditorStore` 的 `scenes`、`links`、`variables`。
- **集成方式**:
  - 条件块通过 `metaJson` 存储条件字段。
  - 预览层通过纯函数读取 block 顺序与变量默认值决定可见 choice。
- **配置来源**: `package.json` 的 `test/build` 脚本与 `tsconfig.json` 的严格模式。

### 6. 技术选型理由

- **为什么用这个方案**: 当前仓库已经稳定使用单一 store + `persist`，在此基础上扩展最小条件能力改动面最小。
- **优势**: 复用现有模式多、测试容易补、不会提前引入复杂条件系统。
- **劣势和风险**: V1 只覆盖单条件与默认变量值，不支持复杂表达式和运行时变量变更。

### 7. 关键风险点

- **边界条件**: 条件块与 choice 的关联范围必须明确，避免影响整段场景渲染。
- **数据兼容**: 旧的 `condition` block 可能没有 `metaJson`，解析时需要安全兜底。
- **性能瓶颈**: 当前只是场景级顺序扫描，复杂度低；未来复杂条件增长时再抽象 evaluator。
- **验证缺口**: 当前桌面壳层无额外联调需求，本轮以本地测试与构建为准。

## 本轮追加：选项副作用

### 已确认缺口

- 设计文档 7.6 仍要求支持“选项选择后修改标记或变量”。
- 当前 `choiceBlock.ts` 只保存 `label` 与 `targetSceneId`。
- 当前 `PreviewPage.tsx` 点击选项后只做场景跳转，不维护运行时变量状态。

### 本轮方案

- 在 choice block 元数据中追加单变量副作用字段。
- 编辑器允许为选项配置“把某个变量设为某个值”。
- 预览页维护局部运行时变量快照，开始预览时从 store 默认值初始化。
- 点击选项时先应用副作用，再进入目标场景，让后续条件块基于新变量值生效。

### 范围限制

- 只支持单个选项影响一个变量。
- 不把运行时变量写回 `useEditorStore`。
- 不做撤销、历史回放、多变量联动或复杂表达式。
