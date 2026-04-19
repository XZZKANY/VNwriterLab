# V2 editor scenes repository drive 实施计划

## 步骤 1：runtime repository

- 新增 `src/lib/repositories/storyRepositoryRuntime.ts`。
- 新增 `src/lib/repositories/storyRepositoryRuntime.test.ts`。
- 验证默认 volatile、测试注入、Tauri SQLite 选择。

## 步骤 2：store TDD

- 新增 `src/features/editor/store/useEditorStore.scenesRepository.test.ts`。
- 覆盖 `hydrateScenes(projectId)` 恢复 scenes/blocks。
- 覆盖 `updateScene` 写回 story repository。
- 覆盖块级新增、编辑、删除、移动后 `saveBlocks` 被调用。

## 步骤 3：页面与持久化回归

- 修改 `EditorPage.tsx`：当前项目且本地 scenes 为空时 hydrate。
- 更新 `EditorPage.test.tsx`：注入 fake story repository，验证自动 hydrate。
- 更新 `persistence.test.ts`：用 fake story repository 验证 scene/block 重载恢复。

## 步骤 4：验证与留痕

- 运行定向测试。
- 运行 `npm.cmd test`。
- 运行 `npm.cmd run build`。
- 更新 `.codex/operations-log.md` 与 `.codex/verification-report.md`。
