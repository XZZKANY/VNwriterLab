## 项目上下文摘要（V1 设定与场景基础关联展示）

生成时间：2026-04-06  
任务目标：为 Lore 页补一个 V1 的只读关联展示区块，基于当前项目场景内容提炼设定被提及的场景，不扩展复杂引用管理。

### 1. 相似实现分析

- **实现 1**: `src/features/projects/pages/ProjectHomePage.tsx`
  - 模式：页面层直接从 store 派生展示数据，先算计数再渲染列表。
  - 可复用：`currentProject.routes`、`currentProject.scenes` 的页面派生模式。
  - 需注意：页面只负责展示，不把统计逻辑下沉到 store。
- **实现 2**: `src/features/graph/pages/GraphPage.tsx`
  - 模式：先把 store 数据映射成图数据，再展示摘要列表。
  - 可复用：先派生 `graph` / `association` 再渲染的结构。
  - 需注意：空态与有数据态要分开处理。
- **实现 3**: `src/features/preview/pages/PreviewPage.tsx`
  - 模式：从场景与块内容中做运行时读取和展示。
  - 可复用：`Scene.blocks`、`contentText` 作为文本来源。
  - 需注意：可见性逻辑应保持纯函数化，便于测试。

### 2. 项目约定

- **命名约定**：页面和组件使用 PascalCase，store hook 使用 `useXxxStore`，局部派生函数使用 camelCase。
- **文件组织**：页面放在 `src/features/*/pages`，store 放在 `src/features/*/store`，领域模型放在 `src/lib/domain`。
- **导入顺序**：先第三方库，再内部模块；同层模块按职责分组。
- **代码风格**：保持轻量页面逻辑，优先页面内纯函数派生，不额外引入 service 层。

### 3. 可复用组件清单

- `src/features/projects/store/useProjectStore.ts`：提供 `currentProject.scenes`。
- `src/features/editor/store/useEditorStore.ts`：定义 `Scene`、`SceneBlock` 与 `contentText` 的真实来源。
- `src/lib/domain/scene.ts`：场景结构定义。
- `src/lib/domain/block.ts`：块结构定义。
- `src/features/lore/store/useLoreStore.ts`：Lore 选中与编辑状态来源。

### 4. 测试策略

- **测试框架**：Vitest + Testing Library + user-event。
- **测试模式**：页面渲染测试，配合 store 预置数据验证空态与命中态。
- **参考文件**：`src/features/lore/pages/LorePage.test.tsx`、`src/features/projects/pages/ProjectHomePage.test.tsx`、`src/features/graph/pages/GraphPage.test.tsx`。
- **覆盖要求**：
  - 有命中时展示关联场景。
  - 无项目或无命中时展示空态。
  - 不影响设定编辑与创建。

### 5. 依赖和集成点

- **外部依赖**：React、Zustand、Vitest、Testing Library、user-event。
- **内部依赖**：`useProjectStore.currentProject.scenes`、`useLoreStore.entries`、`Scene.blocks`。
- **集成方式**：LorePage 页面层直接派生关联展示数据，不改 store 协议。
- **配置来源**：项目现有持久化 store 与页面测试基础设施。

### 6. 技术选型理由

- **为什么用这个方案**：V1 只需要展示基础关联，最小成本是页面层根据现有场景文本做派生，不需要新建关系模型。
- **优势**：实现范围小、测试容易、不会影响现有创建/编辑/持久化链路。
- **劣势和风险**：关联只是“提及级”匹配，准确性有限，但符合 V1 范围。

### 7. 关键风险点

- **边界条件**：当前没有项目、没有选中设定、设定名称或标签为空、场景内容为空。
- **性能瓶颈**：当前只遍历项目场景与块，数据量小，风险可忽略。
- **一致性问题**：如果纯函数写得过于复杂，会让页面测试难以维护，因此必须保持简单。
- **安全考虑**：本任务不涉及新增安全能力。
