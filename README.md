# VN 写作工具 V1（VN Writer Lab）

面向可视小说作家的桌面创作工具，提供"项目首页 / 剧情编辑 / 分支图 / 多视图 / 角色 / 设定 / 预览"完整闭环。

## 技术栈

- **桌面壳**：Tauri 2 + Rust（`src-tauri/`）
- **前端**：React 19 + TypeScript ~5.8 + Vite 7 + react-router 7
- **状态管理**：zustand 5（按职责拆 slice）
- **图形可视化**：reactflow 11
- **持久化**：`@tauri-apps/plugin-sql`（SQLite）
- **测试**：vitest 4 + @testing-library/react + jsdom

## 本地开发

```bash
npm install            # 安装依赖
npm run dev            # 仅前端 Vite 开发服务器（端口 1420）
npm run tauri dev      # 完整 Tauri 桌面开发模式（需要本地 Rust 工具链）
```

`npm run tauri dev` 会同时运行 Vite 与 Tauri 主进程，浏览器/IDE 中只跑 `npm run dev` 也能开发界面，但无法访问 Tauri 提供的桌面/SQLite 能力。

## 测试、构建、检查

```bash
npm test               # vitest 单跑全量
npm run test:watch     # watch 模式
npm run lint           # ESLint flat config 全量扫描
npm run format         # Prettier 格式化全部 ts/tsx/json/css
npm run format:check   # Prettier 格式检查（不改文件）
npm run build          # tsc 类型检查 + Vite 生产构建（输出到 dist/）
npx tsc --noEmit       # 仅做类型检查
```

当前基线：54 个测试文件 / 315 个用例全绿；生产 main bundle 约 286 KB（gzip ≈ 92 KB）；ESLint 0 error / 0 warning；Prettier clean。

提交时 husky `pre-commit` hook 会自动跑 `lint-staged`（仅对暂存文件跑 `eslint --fix` + `prettier --write`）。

CI / 提交前推荐顺序（也是 `.github/workflows/ci.yml` 跑的顺序）：

```bash
npm run format:check && npm run lint && npx tsc --noEmit && npm test && npm run build
```

## 目录结构

```
src/
├─ main.tsx                # 路由入口（懒加载页面）
├─ styles.css              # 全局样式（深色主题，BEM 命名）
├─ app/                    # 应用骨架
│  ├─ layouts/AppShell.tsx # 侧边栏 + 主体 Outlet
│  └─ components/          # 跨页通用组件（如 AutoSaveStatus）
├─ features/               # 功能域（各域内自包含 pages / components / store / lib）
│  ├─ projects/
│  ├─ editor/
│  ├─ graph/
│  ├─ views/
│  ├─ characters/
│  ├─ lore/
│  └─ preview/
└─ lib/                    # 跨域共享
   ├─ domain/              # 领域类型与工厂
   ├─ repositories/        # 仓储抽象 + SQLite 实现 + 运行时切换
   └─ store/               # 跨功能 store（自动保存等）
```

`src-tauri/` 是 Rust 端，平时少改动。

## 路径别名

`@/` 指向 `src/`，已在 `tsconfig.json`、`vite.config.ts`、`vitest.config.ts` 三处统一配置。

```ts
import { useEditorStore } from "@/features/editor/store/useEditorStore";
import type { Scene } from "@/lib/domain/scene";
```

跨包深路径请用 `@/`；同目录或一两层之内的 import 仍可使用 `./X`、`../X`。

## 状态管理约定

- 每个 store 由若干"职责 slice"组合，统一在 `createXxxStoreState.ts` 拼装。
- 任何会改变持久化数据的 action：
  1. 调用 `useAutoSaveStore.getState().markDirty()`
  2. 修改本地状态
  3. 调用 `useAutoSaveStore.getState().markSaved()`
  4. 异步写入 repository
  小型动作可用 `withAutosave(...)`（`@/lib/store/autosave`）一并包装步骤 1/3。
- 跨 store 的同步（如 project 修改 scene 后联动 editor）通过 `useEditorStore.setState` 直接驱动；这是已知的耦合点。

## 自动保存语义

`useAutoSaveStore` 保留三个状态：

- `hasPendingChanges`：是否有未保存的本地修改
- `lastSavedAt`：最近一次保存的 ISO 时间戳（持久化到 localStorage）
- `hasRestoredDraft`：本次会话是否从持久化中恢复过草稿

`AutoSaveStatus` 组件根据这三个状态显示对应文案。

## 长期工作记录

仓库根存放四个常驻文档：

- `TASKS.md` — 待办 / 进行中 / 已完成任务列表
- `PROGRESS.md` — 每轮工作日志
- `ARCHITECTURE.md` — 当前架构与重构方案
- `RESEARCH.md` — 项目调研记录

如需在新会话中继续工作，先按这四个文件确认上下文，再从 `TASKS.md` 中挑下一个任务。

## 文档与规划

仓库内还有以下规划文档（位于根目录）：

- `VN写作工具PRD.md`
- `开发路线图（V1  V1.5  V2）.md`
- `V2模块化实施计划书（当前进度到最终目标）.md`
- `V1 信息架构图（IA）.md`
- `V1 数据库  数据表草案.md`
- `V1页面清单.md`
- `分支图页功能清单.md`
- `剧情编辑页功能清单.md`
- `导航结构 + 页面跳转关系图.md`

若需要更详细的重构脉络，参考 `docs/superpowers/specs/` 与 `docs/superpowers/plans/`。

## V1 范围

- 项目创建（4 种模板）
- 剧情编辑（场景树、块编辑器、变量、条件、注释、伏笔、选项跳转）
- 分支图（reactflow，支持路线/问题筛选）
- 角色 / 设定（参考资料）
- 多视图大纲
- 预览引擎（基于已配置的变量、选项、条件演算流程）
- 全局搜索 + 三种导出（结构化 JSON / 纯文本稿 / 引擎草稿脚本）
