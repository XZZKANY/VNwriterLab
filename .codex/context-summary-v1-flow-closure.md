## 项目上下文摘要（V1 流转闭环）

生成时间：2026-04-05 14:14:37

### 1. 相似实现分析

- **实现1**: `src/features/projects/store/useProjectStore.ts`
  - 模式：使用 Zustand `persist` 中间件持久化页面核心状态。
  - 可复用：`createProject` 通过 `useAutoSaveStore` 统一记录脏状态和保存状态。
  - 需注意：保持 store 作为唯一状态源，不额外引入 service 层。
- **实现2**: `src/features/editor/store/useEditorStore.ts`
  - 模式：编辑器所有业务状态集中在单一 store 中，页面只读取和触发 action。
  - 可复用：`createScene`、`addBlock` 的更新方式、`partialize` 持久化范围。
  - 需注意：`links` 已存在但尚未进入 UI，适合继续扩展而不是另起状态树。
- **实现3**: `src/features/editor/components/SceneBlockList.tsx`
  - 模式：按 `blockType` 分发块编辑器组件，普通文本块直接渲染，复杂块由专用组件负责。
  - 可复用：继续沿用 `choice` / `condition` 的专用编辑器拆分。
  - 需注意：新增上下文应通过 props 传递，不要把复杂逻辑塞回列表组件。
- **实现4**: `src/features/preview/lib/previewEngine.ts`
  - 模式：将预览行为收敛为纯函数，页面只负责交互与展示。
  - 可复用：`resolveNextSceneId` 可继续作为 choice 跳转的核心解析函数。
  - 需注意：保持纯函数接口清晰，便于 Vitest 单测。
- **实现5**: `src/features/graph/components/SceneGraphCanvas.tsx`
  - 模式：React Flow 组件与数据源分离，组件只消费 `nodes`/`edges`。
  - 可复用：把业务 `scenes/links` 先映射成图数据，再交给 React Flow。
  - 需注意：避免把 store 读取逻辑塞进最底层画布组件。

### 2. 项目约定

- **命名约定**：代码标识符使用英文 camelCase / PascalCase；界面文案和测试描述使用简体中文。
- **文件组织**：页面位于 `features/*/pages`，组件位于 `features/*/components`，纯逻辑位于 `features/*/lib` 或 `lib/*`，测试与被测文件共置。
- **导入顺序**：先第三方依赖，再本地模块；类型导入使用 `type`。
- **代码风格**：TypeScript 严格模式；轻量函数式组件；避免额外抽象层；用小型纯函数承接复杂转换。

### 3. 可复用组件清单

- `src/features/editor/store/useEditorStore.ts`：编辑器场景、块、链接、变量的唯一状态源。
- `src/features/editor/store/linkUtils.ts`：choice link 领域结构与构建函数。
- `src/features/preview/lib/previewEngine.ts`：预览跳转纯函数入口。
- `src/lib/store/useAutoSaveStore.ts`：本地自动保存与恢复状态展示。
- `src/app/components/AutoSaveStatus.tsx`：自动保存状态 UI。

### 4. 测试策略

- **测试框架**：Vitest + Testing Library，`jsdom` 环境。
- **测试模式**：页面交互测试 + 纯函数单元测试。
- **参考文件**：
  - `src/features/projects/pages/ProjectHomePage.test.tsx`
  - `src/features/editor/pages/EditorPage.test.tsx`
  - `src/features/editor/store/linkUtils.test.ts`
  - `src/features/preview/lib/previewEngine.test.ts`
- **覆盖要求**：正常流程、刷新恢复、场景跳转、空状态展示。

### 5. 依赖和集成点

- **外部依赖**：
  - Zustand 5：store 与 `persist` 持久化
  - React Router 7：页面路由
  - React Flow 11：分支图渲染
  - Vitest / Testing Library：单测与页面测试
- **内部依赖**：
  - `PreviewPage` 依赖 `useEditorStore` 中的 `scenes` 与 `links`
  - `GraphPage` 依赖 `useEditorStore` 中的 `scenes` 与 `links`
  - `ChoiceBlockEditor` 需要与 `useEditorStore` 的 block 更新和 link 更新 action 集成
- **配置来源**：`package.json`、`tsconfig.json`、`vitest.config.ts`

### 6. 技术选型理由

- **为什么用这个方案**：现有项目已经把编辑器状态集中在 Zustand store 中，继续复用这条主线成本最低且一致性最好。
- **优势**：无需引入新状态层即可把编辑、预览、分支图打通；测试可以分别落在页面和纯函数层。
- **劣势和风险**：`metaJson` 需要明确结构，否则 choice block 配置容易分散；预览和分支图要注意空状态与未配置跳转。

### 7. 关键风险点

- **并发问题**：当前为单用户本地状态，无额外并发风险。
- **边界条件**：未选择目标场景的选项、没有起始场景时的预览、分支图空数据状态。
- **性能瓶颈**：当前数据量小，图映射纯函数成本可忽略。
- **工具限制**：本轮无法使用 `github.search_code`，因此外部参考以 Context7 官方文档为主。

### 8. 外部资料

- **Zustand 官方文档**：`/pmndrs/zustand`
  - 用途：确认 `persist` 的 `partialize` 与 `onRehydrateStorage` 推荐模式，保持 store 扩展方式与官方一致。
- **React Flow 官方文档**：`/websites/reactflow_dev`
  - 用途：确认节点与边以受控 `nodes` / `edges` 数组传入组件的最小模式。
