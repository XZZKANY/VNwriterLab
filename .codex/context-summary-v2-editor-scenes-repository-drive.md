## 项目上下文摘要（V2 editor scenes repository drive）

生成时间：2026-04-11 00:00:00

### 1. 相似实现分析

- **实现1**: `src/lib/repositories/projectRepositoryRuntime.ts`
  - 模式：运行时 repository 单例，非 Tauri 使用 volatile，Tauri 使用 SQLite adapter。
  - 可复用：`get...Repository`、`set...RepositoryForTesting`、`reset...RepositoryForTesting` 注入模式。
  - 需注意：测试通过 reset 清理 singleton 与 override。
- **实现2**: `src/lib/repositories/referenceRepositoryRuntime.ts`
  - 模式：volatile Map 存储角色、设定、变量，并按项目过滤。
  - 可复用：同类 runtime repository 结构与非 Tauri fallback。
  - 需注意：快照保存按 projectId 先删除再写入。
- **实现3**: `src/features/editor/store/useEditorStore.variablesRepository.test.ts`
  - 模式：先注入 fake repository，再调用 store action 验证 hydrate/save 行为。
  - 可复用：`setReferenceRepositoryForTesting` 风格可平移到 story repository。
  - 需注意：每个测试前清理 localStorage、store 与 repository override。

### 2. 项目约定

- **命名约定**: TypeScript 使用 camelCase 函数和变量，React 组件使用 PascalCase。
- **文件组织**: domain、repositories、features/*/store、features/*/pages 分层清晰。
- **导入顺序**: 外部包、领域类型、repository/runtime、store/local helper 依次组织。
- **代码风格**: Vitest + Testing Library；store action 通过 Zustand `get/set` 修改状态。

### 3. 可复用组件清单

- `src/lib/repositories/storyRepository.ts`: scenes/blocks repository 接口。
- `src/lib/repositories/sqliteStoryRepository.ts`: SQLite scenes 与 scene_blocks adapter。
- `src/features/editor/store/editorSceneUtils.ts`: 场景块排序和结构归一化工具。
- `src/lib/store/useAutoSaveStore.ts`: 保存/恢复状态标记。

### 4. 测试策略

- **测试框架**: Vitest、Testing Library。
- **测试模式**: repository runtime 单元测试、store action 单元测试、页面 hydrate 测试、persistence 回归测试。
- **参考文件**: `referenceRepositoryRuntime.test.ts`、`useEditorStore.variablesRepository.test.ts`、`EditorPage.test.tsx`、`persistence.test.ts`。
- **覆盖要求**: hydrateScenes、updateScene、block 添加/编辑/删除/移动、页面自动 hydrate、重载恢复。

### 5. 依赖和集成点

- **外部依赖**: Zustand、Vitest、React。
- **内部依赖**: `StoryRepository`、`sqliteStoryRepository`、`useEditorStore`、`EditorPage`、`useProjectStore`。
- **集成方式**: store action 调 runtime repository；页面通过 useEffect 在当前项目空场景状态下 hydrate。
- **配置来源**: Tauri runtime 通过 `window.__TAURI_INTERNALS__` 选择 SQLite adapter。

### 6. 技术选型理由

- **为什么用这个方案**: 复用现有 repository 抽象，避免继续依赖 editor store localStorage 作为长期数据源。
- **优势**: 改动边界小，与前序 project/reference store repository 驱动保持一致。
- **劣势和风险**: 当前 StoryRepository 没有 links、deleteScene、saveScenes 接口，因此本段不处理这些路径。

### 7. 关键风险点

- **并发问题**: 块操作后异步 `saveBlocks` 未等待，测试应通过 mock 断言调用，不把保存结果阻塞 UI。
- **边界条件**: `projectId` 为空时 hydrateScenes 应退出并标记未恢复。
- **性能瓶颈**: 高频块编辑可能触发多次 scene 级快照保存，后续可按编辑节流单独规划。
- **安全考虑**: 本段不新增认证、鉴权或加密逻辑。

### 8. 充分性检查

- 能定义接口契约：是，复用 `StoryRepository` 的 `listScenes/updateScene/saveBlocks`。
- 理解技术选型理由：是，沿用 repository runtime 模式，避免重复 SQL。
- 识别主要风险：是，links/delete/move 不在当前接口内，暂不迁移。
- 知道如何验证实现：是，定向测试 + 全量测试 + build。
