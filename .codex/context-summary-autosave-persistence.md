## 项目上下文摘要（自动保存持久化）

生成时间：2026-04-04 19:35:00

### 1. 相似实现分析

- **实现 1**: [useProjectStore.ts](D:/VNwriterLab/src/features/projects/store/useProjectStore.ts)
  - 模式：使用 Zustand `create` 创建单一项目状态源。
  - 可复用：`currentProject` 与 `createProject` 的页面接入方式。
  - 需注意：当前没有持久化，也没有恢复状态。
- **实现 2**: [useEditorStore.ts](D:/VNwriterLab/src/features/editor/store/useEditorStore.ts)
  - 模式：使用 Zustand `create` 维护场景、链接、变量与选中状态。
  - 可复用：`createScene`、`addBlock` 的最小写操作入口。
  - 需注意：当前编辑器状态完全驻留内存，刷新即丢失。
- **实现 3**: [useAutoSaveStore.ts](D:/VNwriterLab/src/lib/store/useAutoSaveStore.ts)
  - 模式：轻量独立 store，负责最近保存时间。
  - 可复用：作为统一保存状态来源，避免把保存元数据散落在页面。
  - 需注意：目前只记录时间戳，没有脏状态和恢复状态。
- **实现 4**: [ProjectHomePage.test.tsx](D:/VNwriterLab/src/features/projects/pages/ProjectHomePage.test.tsx)
  - 模式：Vitest + Testing Library，围绕用户行为写页面断言。
  - 可复用：创建项目交互的断言风格。
- **实现 5**: [EditorPage.test.tsx](D:/VNwriterLab/src/features/editor/pages/EditorPage.test.tsx)
  - 模式：通过按钮交互触发 store 写操作。
  - 可复用：创建场景与添加内容块的最小行为覆盖。

### 2. 项目约定

- **命名约定**：界面文案使用简体中文；代码标识符使用英文 camelCase。
- **文件组织**：store 放在对应 feature 或 `src/lib/store/` 下；测试与模块共置。
- **导入顺序**：第三方依赖在前，本地模块在后。
- **代码风格**：优先小而直接的 Zustand store，不新增复杂抽象层。

### 3. 可复用组件清单

- [useProjectStore.ts](D:/VNwriterLab/src/features/projects/store/useProjectStore.ts)：项目状态源
- [useEditorStore.ts](D:/VNwriterLab/src/features/editor/store/useEditorStore.ts)：编辑器状态源
- [useAutoSaveStore.ts](D:/VNwriterLab/src/lib/store/useAutoSaveStore.ts)：保存元状态
- [setupTests.ts](D:/VNwriterLab/src/test/setupTests.ts)：测试环境初始化

### 4. 测试策略

- **测试框架**：Vitest + jsdom + Testing Library
- **测试模式**：先写失败测试，再补最小实现
- **参考文件**：
  - [ProjectHomePage.test.tsx](D:/VNwriterLab/src/features/projects/pages/ProjectHomePage.test.tsx)
  - [EditorPage.test.tsx](D:/VNwriterLab/src/features/editor/pages/EditorPage.test.tsx)
  - [app.acceptance.test.tsx](D:/VNwriterLab/src/test/app.acceptance.test.tsx)
- **新增策略**：使用 `vi.resetModules()` 模拟刷新重载，验证持久化恢复

### 5. 依赖和集成点

- **外部依赖**：`zustand`、`vitest`
- **内部依赖**：项目页和编辑页都直接依赖 store
- **集成方式**：通过 Zustand 官方 `persist` 中间件接入持久化
- **官方依据**：Context7 `/pmndrs/zustand` 文档推荐 `persist` + `partialize`

### 6. 技术选型理由

- **为什么用这个方案**：当前仓库已经以 Zustand 为唯一前端状态源，直接复用官方 `persist` 中间件能以最小改动获得真实持久化。
- **优势**：与现有架构一致、测试简单、在 Tauri WebView 中可直接落盘到本地存储。
- **风险**：项目状态和编辑器状态分属两个 store，需要统一维护保存元状态，避免恢复顺序混乱。

### 7. 关键风险点

- **恢复顺序**：多个 store 重载时，`hasHydrated` 需要有一致语义。
- **测试隔离**：localStorage 与模块缓存需要在每个测试前清理。
- **扩展性**：后续若切换到 SQLite，需要保留当前 store API 稳定。
