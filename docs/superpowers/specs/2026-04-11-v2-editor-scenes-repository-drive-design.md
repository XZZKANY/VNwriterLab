# V2 editor scenes repository drive 设计

## 目标

将编辑器场景正文链路从单纯依赖 Zustand/localStorage 的恢复方式，推进到 `StoryRepository` 驱动：页面进入当前项目时可从 repository 恢复 scenes/blocks，场景基础信息和块级内容变更会写回 repository。

## 范围

- 新增 `storyRepositoryRuntime`，与 project/reference runtime repository 保持一致。
- 在 `useEditorStore` 增加 `hydrateScenes(projectId)`。
- 在 `updateScene` 与块级变更后调用 `StoryRepository.updateScene/saveBlocks`。
- 在 `EditorPage` 对当前项目且 editor store 场景为空时自动 hydrate。
- 更新 store、page、persistence 测试。

## 非目标

- 不迁移 `links` 持久化。
- 不新增 `deleteScene`、`moveScene`、`saveScenes` 等 StoryRepository 接口。
- 不改变 ProjectRepository 负责项目结构快照的职责。

## 设计

1. `storyRepositoryRuntime`
   - 非 Tauri 环境使用 volatile repository。
   - Tauri 环境使用 `createSqliteStoryRepository()`。
   - 暴露 `getStoryRepository`、`setStoryRepositoryForTesting`、`resetStoryRepositoryForTesting`。

2. `useEditorStore`
   - `hydrateScenes(projectId)` 调 `listScenes(projectId)`，替换同项目 scenes，保留其他项目 scenes。
   - 如果当前选中场景不属于 hydrate 结果，则选中第一条恢复场景。
   - `updateScene` 更新本地状态后调用 `updateScene(nextScene)`。
   - `addBlock/deleteBlock/moveBlockUp/moveBlockDown/updateBlockContent/updateChoiceBlock/updateConditionBlock` 更新本地状态后调用 `saveBlocks(sceneId, nextBlocks)`。

3. `EditorPage`
   - 增加 `hydrateScenes` action。
   - 当前项目存在且 `scenes` 中没有该项目场景时触发 hydrate。
   - 当前项目场景基础信息编辑时，先更新 project store，再通过 editor store 保存 story scene 快照。

## 风险与后续

- 块级输入仍是 action 级保存，后续如引入逐字符持久化，应单独设计节流或批处理。
- links 可以后续由 choice block 派生或新增独立 repository 接口；本段不混入该决策。
