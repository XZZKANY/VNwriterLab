# V2 Step 6：scene lifecycle 与 links repository 边界设计

## 背景

前序已经完成 `ProjectRepository`、`ReferenceRepository`、`StoryRepository` 的主要运行时接线，并让 editor scenes/blocks 支持 `hydrateScenes`、`updateScene` 与 `saveBlocks`。剩余缺口集中在两类：

1. 场景生命周期：`createSceneInRoute`、`importScene`、`deleteScene`、`moveScene` 仍主要由 ProjectStore 和 EditorStore 本地状态处理。
2. links：`GraphPage` 和 `PreviewPage` 直接消费 `useEditorStore.links`，但 `StoryRepository` 尚未读取或保存 `scene_links`。

## 证据

- `src/features/projects/store/useProjectStore.ts`：ProjectStore 负责 routes/scenes 生命周期，并保存 ProjectRepository 快照。
- `src/lib/repositories/storyRepository.ts`：当前只有 `listScenes/createScene/updateScene/saveBlocks`。
- `src-tauri/src/migrations.rs`：已创建 `scene_links` 表。
- `src/features/graph/lib/graphData.ts`：分支图输入为 `scenes + links + variables`。
- `src/features/preview/pages/PreviewPage.tsx`：预览跳转通过 `links` 解析下一场景。

## 职责划分

### ProjectRepository

继续作为项目结构快照的持久化边界，负责 project、routes、scene metadata 的整体结构恢复。

### StoryRepository

作为 story 内容表的持久化边界，负责：

- `scenes` 表的单场景创建、更新、删除。
- `scene_blocks` 表的块快照保存和删除清理。
- 后续 `scene_links` 表的链接快照保存和恢复。

### Store 层

- ProjectStore 仍是场景结构生命周期的编排入口。
- EditorStore 仍是 UI 编辑状态和正文块的编排入口。
- Store 层不得直接拼 SQL，只调用 repository runtime。

## 推荐实施顺序

### Step 6A：scene lifecycle

- 扩展 `StoryRepository.deleteScene(sceneId): Promise<void>`。
- SQLite adapter 删除 `scene_links`、`scene_blocks`、`scenes` 中对应 scene。
- volatile story repository 同步删除 scene。
- ProjectStore 在创建、更新、删除、移动场景后同步调用 StoryRepository。
- 该阶段不新增 links 的 list/save 接口，只在删除场景时清理 `scene_links`。

### Step 6B：links repository

- 基于既有 `scene_links` 表扩展接口：
  - `listLinks(projectId: string): Promise<SceneLink[]>`
  - `saveLinks(projectId: string, links: SceneLink[]): Promise<void>`
- EditorStore 在 `hydrateScenes` 后恢复 links，或新增独立 `hydrateLinks`。
- `updateChoiceBlock`、`deleteBlock`、`deleteScene` 后保存当前项目 links 快照。
- GraphPage 与 PreviewPage 保持消费 `useEditorStore.links`，避免一次性改运行语义。

## 非目标

- 不在 Step 6A 中处理 links 全量持久化。
- 不把 SQL 写进 store。
- 不在本轮引入新的状态管理库或数据库库。

## 风险控制

- scene lifecycle 和 links 分两段实现，避免一次性大范围回归。
- 每段都先写 repository 与 store/page 回归测试。
- 每段完成后运行定向测试、全量测试和 build。
