# V2 Step 6：scene lifecycle 与 links repository 边界实施计划

## 推荐顺序

先做 **Step 6A：scene lifecycle**，再做 **Step 6B：links repository**。

## Step 6A：scene lifecycle

### 任务 1：扩展 StoryRepository 生命周期接口

- 修改 `src/lib/repositories/storyRepository.ts`：新增 `deleteScene(sceneId: string): Promise<void>`。
- 修改 `src/lib/repositories/storyRepositoryRuntime.ts`：volatile repository 删除 scene。
- 修改 `src/lib/repositories/sqliteStoryRepository.ts`：删除顺序为 `scene_links`、`scene_blocks`、`scenes`。
- 修改/新增测试：
  - `src/lib/repositories/storyRepositoryRuntime.test.ts`
  - `src/lib/repositories/sqliteStoryRepository.test.ts`

### 任务 2：ProjectStore 同步 StoryRepository

- `createSceneInRoute` 创建 scene 后调用 `getStoryRepository().createScene(...)` 或等效保存 metadata。
- `updateScene`、`moveSceneUp`、`moveSceneDown`、`moveSceneToRoute` 后对受影响 scenes 调 `updateScene`。
- `deleteScene` 后调用 `deleteScene(sceneId)`。
- 补充 `useProjectStore.repository.test.ts` 覆盖调用行为。

### 任务 3：验证 Step 6A

- 运行 scene lifecycle 定向测试。
- 运行 `npm.cmd test`。
- 运行 `npm.cmd run build`。
- 更新 `.codex/operations-log.md` 与 `.codex/verification-report.md`。

## Step 6B：links repository

### 任务 4：扩展 StoryRepository links 接口

- 修改 `src/lib/repositories/storyRepository.ts`：新增 `listLinks(projectId)` 与 `saveLinks(projectId, links)`。
- 修改 `storyRepositoryRuntime.ts`：volatile links Map。
- 修改 `sqliteStoryRepository.ts`：读写 `scene_links`。
- 新增/修改 repository 测试。

### 任务 5：EditorStore links hydrate/save

- 新增或扩展 hydrate：从 StoryRepository 恢复 links。
- `updateChoiceBlock` 后保存当前项目 links 快照。
- `deleteBlock`、`deleteScene` 后同步保存清理后的 links。

### 任务 6：Graph/Preview 回归

- 更新 `GraphPage` 与 `PreviewPage` 相关测试，验证 repository 恢复后的 links 可用于分支图和预览跳转。
- 运行定向测试、全量测试和 build。
- 更新 `.codex` 留痕。
