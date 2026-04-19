## 项目上下文摘要（项目首页快速继续创作入口）

生成时间：2026-04-18  

### 1. 相似实现分析

- **实现1**：`src/features/projects/pages/ProjectHomePage.tsx`
  - 模式：页面内聚合读取多个 store，并通过 `useNavigate` 进行页面跳转。
  - 可复用：`useProjectStore`、`useEditorStore.selectScene`、现有项目统计与搜索区块。
  - 需注意：主页当前已经有统计、路线列表与全局搜索，新增入口应保持原有区块不被破坏。
- **实现2**：`src/features/graph/pages/GraphPage.tsx`
  - 模式：从图谱节点返回编辑页，跳转前先 `selectScene(sceneId)` 再 `navigate("/editor")`。
  - 可复用：快捷动作的“先选中再跳转”行为。
  - 需注意：图页的返回编辑按钮说明了当前项目的场景选择语义。
- **实现3**：`src/features/preview/pages/PreviewPage.tsx`
  - 模式：预览页提供“从开头预览 / 从当前节点预览”两种入口。
  - 可复用：主页“从头预览”入口只需要进入预览页，预览逻辑由页面自身负责。
  - 需注意：预览页并不依赖主页额外传参。
- **实现4**：`src/features/characters/pages/CharactersPage.tsx`
  - 模式：页面按当前项目与选中项展示详情，并以中文文案组织信息区块。
  - 可复用：中文文案、section/aria-label 的信息展示习惯。

### 2. 项目约定

- **命名约定**：组件与 store 使用 PascalCase / camelCase，测试文件与被测文件同名并以 `.test.tsx` 结尾。
- **文件组织**：功能聚合在 `src/features/<domain>/pages|components|store|lib`。
- **导入顺序**：先第三方，再项目内相对路径。
- **代码风格**：函数组件 + hooks + Zustand，页面逻辑偏直接，不额外引入新抽象层。

### 3. 可复用组件清单

- `src/features/projects/store/useProjectStore.ts`：当前项目与创建/重置入口。
- `src/features/editor/store/useEditorStore.ts`：场景选择状态与场景数组来源。
- `src/features/graph/lib/graphData.ts`：图页已有场景/问题派生规则，可作语义参考。
- `src/features/preview/pages/PreviewPage.tsx`：预览入口语义参考。

### 4. 测试策略

- **测试框架**：Vitest + Testing Library + user-event。
- **测试模式**：先清空 `localStorage`，再重置相关 store，最后 `cleanup()`。
- **参考文件**：`src/features/editor/pages/EditorPage.test.tsx`、`src/features/preview/pages/PreviewPage.test.tsx`。
- **覆盖要求**：展示类断言 + 按钮点击后副作用断言 + 空态断言。

### 5. 依赖和集成点

- **外部依赖**：`react-router-dom` 的 `useNavigate`，Testing Library 的 DOM 断言。
- **内部依赖**：`useProjectStore.currentProject`、`useEditorStore.scenes`、`selectedSceneId`、`selectScene`。
- **集成方式**：主页直接派生最近编辑信息并调用现有跳转逻辑。
- **配置来源**：项目首页页面本身与现有 router。

### 6. 技术选型理由

- **为什么用这个方案**：最近编辑入口属于页面层派生展示，现有 store 已能提供足够状态，不必增加新持久化字段。
- **优势**：改动面小、与当前架构一致、测试容易稳定。
- **劣势和风险**：由于缺少独立“最近编辑时间戳”，最近编辑只能基于当前选中场景或可用场景顺序推断。

### 7. 关键风险点

- **边界条件**：当前项目没有场景时必须显示空态，不能渲染空按钮。
- **一致性**：快捷入口应先同步选中场景再跳转，避免进入目标页时上下文丢失。
- **性能瓶颈**：派生列表很小，风险极低。
- **安全考虑**：本次改动不涉及额外安全逻辑。
