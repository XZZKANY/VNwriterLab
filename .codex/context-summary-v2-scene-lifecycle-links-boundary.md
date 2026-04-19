## 项目上下文摘要（V2 scene lifecycle 与 links 边界）

生成时间：2026-04-11 15:15:00

### 1. 相似实现分析

- **实现1**: `src/features/projects/store/useProjectStore.ts`
  - 模式：ProjectStore 是项目结构权威，负责 routes/scenes 生命周期，并通过 `syncEditorScenesFromProjectScenes` 同步 editor store。
  - 可复用：`saveProjectSnapshot`、`createSceneInRoute`、`deleteScene`、`moveSceneUp/Down/ToRoute` 的状态更新顺序。
  - 需注意：当前仅保存 ProjectRepository，没有同步 StoryRepository 的 scene lifecycle。
- **实现2**: `src/lib/repositories/sqliteStoryRepository.ts`
  - 模式：adapter 负责 scenes 与 scene_blocks 的 row/domain 转换。
  - 可复用：`createScene`、`updateScene`、`saveBlocks`。
  - 需注意：还没有 `deleteScene`、`listLinks`、`saveLinks`。
- **实现3**: `src/features/editor/store/useEditorStore.ts`
  - 模式：editor store 维护 blocks 与 links，choice block 更新时同步构建 `SceneLink`。
  - 可复用：`buildChoiceLink`、块更新后保存快照的模式。
  - 需注意：links 仍是显式状态，GraphPage/PreviewPage 都依赖它。

### 2. 项目约定

- **命名约定**: repository 接口使用动词开头的 async 方法，例如 `listScenes`、`updateScene`、`saveBlocks`。
- **文件组织**: repository 接口在 `src/lib/repositories`，store 编排在 `src/features/*/store`，页面消费 store。
- **导入顺序**: 外部依赖、domain 类型、repository runtime、store/helper。
- **代码风格**: store 层使用 Zustand；repository 测试使用 fake executor 或 fake repository。

### 3. 可复用组件清单

- `src/features/projects/store/projectSceneUtils.ts`: 场景排序、移动、同步 editor/project scene metadata。
- `src/features/editor/store/linkUtils.ts`: `SceneLink` 类型和 `buildChoiceLink`。
- `src/features/graph/lib/graphData.ts`: `buildSceneGraph(scenes, links, variables)`。
- `src/features/preview/pages/PreviewPage.tsx`: 预览路径仍依赖 `links` 解析下一场景。

### 4. 数据库与接口证据

- `src-tauri/src/migrations.rs` 已存在 `scene_links` 表。
- `StoryRepository` 当前只有 `listScenes/createScene/updateScene/saveBlocks`。
- `ProjectRepository` 当前保存整个 `Project` 结构快照。

### 5. 依赖和集成点

- **ProjectStore → ProjectRepository**: 结构快照保存，包含 routes/scenes metadata。
- **ProjectStore → EditorStore**: 删除/移动/更新场景时同步 editor scenes 与 links。
- **EditorStore → StoryRepository**: 当前已负责 scenes hydrate、updateScene、saveBlocks。
- **GraphPage/PreviewPage → EditorStore.links**: links 是渲染分支图和预览跳转的直接输入。

### 6. 技术选型理由

- **先做 scene lifecycle**: 只扩 `deleteScene` 并复用 `createScene/updateScene`，风险低。
- **后做 links**: links 既有数据库表又有运行时显式状态，语义更复杂，应独立规划和验证。
- **不在 store 拼 SQL**: 保持 repository adapter 边界，避免 SQL 逻辑泄漏到 UI 状态层。

### 7. 关键风险点

- **双源风险**: ProjectRepository 与 StoryRepository 都保存 scene metadata，需要明确 ProjectStore 是结构权威，StoryRepository 是 story 表写入镜像。
- **链接一致性**: `choice.metaJson` 与 `links` 可能不一致，Step 6B 需明确同步策略。
- **删除级联**: 删除 scene 时需同步清理 scene_blocks 与 scene_links，避免孤儿数据。
- **性能风险**: links 快照保存可接受，但高频输入可后续节流。
