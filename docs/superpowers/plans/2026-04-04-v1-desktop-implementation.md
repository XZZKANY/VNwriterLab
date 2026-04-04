# VN 写作工具 V1 桌面端 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 从 0 搭建一个本地桌面优先的 VN 写作工具 V1，让用户能够创建项目、编辑场景、配置分支条件、查看结构图、维护角色与设定，并在预览页跑通至少一条故事路径。

**Architecture:** 采用 `Tauri + React + TypeScript + Vite + SQLite` 的单仓桌面应用结构。前端负责页面、状态与交互；Tauri 负责桌面壳与本地数据库接入；所有页面共享统一的领域模型和仓储接口，确保编辑器、分支图与预览系统读取同一套数据。

**Tech Stack:** Tauri v2、React、TypeScript、Vite、SQLite、`@tauri-apps/plugin-sql`、React Router、Zustand、React Flow、Vitest、Testing Library

---

## 执行前假设

1. 当前仓库还没有代码，本计划按 greenfield 项目编写。
2. 当前目录不是 Git 仓库，因此所有 `git add` / `git commit` 步骤都应在后续正式代码仓库中执行。
3. 包管理器统一使用 `npm`，并假设本机已安装 Node.js、Rust 与 Tauri 所需系统依赖。
4. 数据持久化采用本地 SQLite，优先使用 Tauri SQL 插件与迁移机制，不额外引入在线后端。

## 推荐目录结构

在初始化完成后，代码仓库应整理为以下结构：

```text
/
├─ package.json
├─ tsconfig.json
├─ vite.config.ts
├─ vitest.config.ts
├─ src/
│  ├─ app/
│  │  ├─ router.tsx
│  │  ├─ layouts/AppShell.tsx
│  │  └─ providers/AppProviders.tsx
│  ├─ components/
│  ├─ features/
│  │  ├─ projects/
│  │  ├─ editor/
│  │  ├─ graph/
│  │  ├─ characters/
│  │  ├─ lore/
│  │  └─ preview/
│  ├─ lib/
│  │  ├─ db/
│  │  ├─ domain/
│  │  ├─ repositories/
│  │  └─ store/
│  ├─ test/
│  │  ├─ fixtures/
│  │  └─ setupTests.ts
│  ├─ main.tsx
│  └─ styles.css
├─ src-tauri/
│  ├─ Cargo.toml
│  ├─ tauri.conf.json
│  └─ src/
│     ├─ main.rs
│     ├─ lib.rs
│     └─ migrations.rs
└─ docs/
   └─ superpowers/
```

## 文件职责映射

- `src/lib/domain/`：统一领域类型、枚举和纯函数，避免页面层各自定义数据结构。
- `src/lib/db/`：数据库连接、SQL 语句、行记录映射与仓储实现。
- `src/lib/store/`：会话态、当前项目、当前场景与编辑中状态。
- `src/features/projects/`：项目首页、项目创建、最近编辑、项目结构管理。
- `src/features/editor/`：剧情编辑器、场景树、内容块编辑、块排序。
- `src/features/graph/`：分支图、节点筛选、问题提示。
- `src/features/characters/`：角色列表与详情编辑。
- `src/features/lore/`：设定列表与详情编辑。
- `src/features/preview/`：预览引擎、路径推进与当前状态显示。
- `src-tauri/src/migrations.rs`：SQLite 初始化表结构与升级脚本。

### Task 1: 初始化桌面工程与基础测试工具链

**Files:**
- Create: `package.json`
- Create: `vitest.config.ts`
- Create: `src/test/setupTests.ts`
- Create: `src/app/layouts/AppShell.tsx`
- Create: `src/app/layouts/AppShell.test.tsx`
- Modify: `src/main.tsx`
- Modify: `src/styles.css`
- Modify: `src-tauri/tauri.conf.json`

- [ ] **Step 1: 使用官方脚手架创建 Tauri + React + TypeScript 项目**

Run:

```bash
npm create tauri-app@latest
```

选择项固定为：

```text
Project name: vn-writer-lab
Package manager: npm
UI template: React
UI flavor: TypeScript
```

Expected: 创建 `src/`、`src-tauri/`、`package.json` 与基础 Tauri 配置文件。

- [ ] **Step 2: 安装路由、状态、分支图与测试依赖**

Run:

```bash
npm install react-router-dom zustand reactflow @tauri-apps/plugin-sql
npm install -D vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event @types/node
```

Expected: `package.json` 中出现运行时依赖与测试依赖。

- [ ] **Step 3: 先写 AppShell 的失败测试**

Create `src/app/layouts/AppShell.test.tsx`:

```tsx
import { MemoryRouter } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import { AppShell } from './AppShell';

describe('AppShell', () => {
  it('渲染 V1 六个核心导航入口', () => {
    render(
      <MemoryRouter>
        <AppShell />
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: '项目首页' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '剧情编辑' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '分支图' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '角色' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '设定' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '预览' })).toBeInTheDocument();
  });
});
```

Run:

```bash
npm run test -- AppShell.test.tsx
```

Expected: FAIL，提示 `AppShell` 未导出或缺少导航链接。

- [ ] **Step 4: 配置测试基线并实现最小 AppShell**

Create `vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setupTests.ts'],
    globals: true,
  },
});
```

Create `src/test/setupTests.ts`:

```ts
import '@testing-library/jest-dom';
```

Modify `package.json` scripts:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "test": "vitest run",
    "test:watch": "vitest",
    "tauri": "tauri"
  }
}
```

Create `src/app/layouts/AppShell.tsx`:

```tsx
import { NavLink, Outlet } from 'react-router-dom';

const navItems = [
  { to: '/', label: '项目首页' },
  { to: '/editor', label: '剧情编辑' },
  { to: '/graph', label: '分支图' },
  { to: '/characters', label: '角色' },
  { to: '/lore', label: '设定' },
  { to: '/preview', label: '预览' },
];

export function AppShell() {
  return (
    <div className="app-shell">
      <aside className="app-shell__sidebar">
        <h1>VN 写作工具</h1>
        <nav>
          <ul>
            {navItems.map((item) => (
              <li key={item.to}>
                <NavLink to={item.to}>{item.label}</NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
      <main className="app-shell__main">
        <Outlet />
      </main>
    </div>
  );
}
```

Modify `src/main.tsx`:

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { AppShell } from './app/layouts/AppShell';
import './styles.css';

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [{ index: true, element: <div>欢迎开始你的 VN 项目</div> }],
  },
]);

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);
```

Modify `src/styles.css`:

```css
body {
  margin: 0;
  font-family: 'Microsoft YaHei', sans-serif;
  color: #1f2937;
  background: linear-gradient(180deg, #f7f3eb 0%, #f2efe8 100%);
}

.app-shell {
  display: grid;
  grid-template-columns: 240px 1fr;
  min-height: 100vh;
}

.app-shell__sidebar {
  padding: 24px;
  background: #fffaf1;
  border-right: 1px solid #e5dccd;
}

.app-shell__main {
  padding: 24px;
}
```

- [ ] **Step 5: 运行验证并提交**

Run:

```bash
npm run test -- AppShell.test.tsx
npm run tauri dev
```

Expected:

```text
Vitest: PASS 1 test
Tauri dev: 打开桌面窗口并显示左侧导航
```

Commit:

```bash
git add package.json vitest.config.ts src/test/setupTests.ts src/main.tsx src/styles.css src/app/layouts/AppShell.tsx src/app/layouts/AppShell.test.tsx src-tauri/tauri.conf.json
git commit -m "feat: 初始化桌面应用壳层与测试基线"
```

### Task 2: 建立统一领域模型与仓储接口

**Files:**
- Create: `src/lib/domain/project.ts`
- Create: `src/lib/domain/scene.ts`
- Create: `src/lib/domain/block.ts`
- Create: `src/lib/domain/character.ts`
- Create: `src/lib/domain/lore.ts`
- Create: `src/lib/domain/variable.ts`
- Create: `src/lib/repositories/projectRepository.ts`
- Create: `src/lib/repositories/storyRepository.ts`
- Create: `src/lib/repositories/referenceRepository.ts`
- Create: `src/lib/domain/domain.test.ts`

- [ ] **Step 1: 先写领域模型的失败测试**

Create `src/lib/domain/domain.test.ts`:

```ts
import { createEmptyProject } from './project';

describe('createEmptyProject', () => {
  it('生成带默认共通线的空项目对象', () => {
    const project = createEmptyProject('雨夜回响', '一段校园悬疑故事');

    expect(project.name).toBe('雨夜回响');
    expect(project.summary).toBe('一段校园悬疑故事');
    expect(project.routes).toHaveLength(1);
    expect(project.routes[0].routeType).toBe('common');
  });
});
```

Run:

```bash
npm run test -- domain.test.ts
```

Expected: FAIL，提示缺少 `createEmptyProject` 实现。

- [ ] **Step 2: 实现项目、路线、场景和块类型**

Create `src/lib/domain/block.ts`:

```ts
export type BlockType = 'narration' | 'dialogue' | 'choice' | 'condition' | 'note';

export interface SceneBlock {
  id: string;
  sceneId: string;
  blockType: BlockType;
  sortOrder: number;
  characterId: string | null;
  contentText: string;
  metaJson: string | null;
}
```

Create `src/lib/domain/scene.ts`:

```ts
import type { SceneBlock } from './block';

export type SceneType = 'normal' | 'branch' | 'ending';
export type SceneStatus = 'draft' | 'completed' | 'needs_revision';

export interface Scene {
  id: string;
  projectId: string;
  routeId: string;
  title: string;
  summary: string;
  sceneType: SceneType;
  status: SceneStatus;
  chapterLabel: string;
  sortOrder: number;
  isStartScene: boolean;
  isEndingScene: boolean;
  notes: string;
  blocks: SceneBlock[];
}
```

Create `src/lib/domain/project.ts`:

```ts
export interface Route {
  id: string;
  projectId: string;
  name: string;
  routeType: 'common' | 'character' | 'true_end' | 'bad_end' | 'hidden';
  description: string;
  sortOrder: number;
}

export interface Project {
  id: string;
  name: string;
  summary: string;
  projectType: 'linear' | 'multi_ending' | 'route_based';
  routes: Route[];
  scenes: import('./scene').Scene[];
}

export function createEmptyProject(name: string, summary: string): Project {
  const projectId = crypto.randomUUID();
  const routeId = crypto.randomUUID();

  return {
    id: projectId,
    name,
    summary,
    projectType: 'route_based',
    routes: [
      {
        id: routeId,
        projectId,
        name: '共通线',
        routeType: 'common',
        description: '默认创建的起始路线',
        sortOrder: 0,
      },
    ],
    scenes: [],
  };
}
```

- [ ] **Step 3: 定义角色、设定、变量与仓储接口**

Create `src/lib/domain/character.ts`:

```ts
export interface Character {
  id: string;
  projectId: string;
  name: string;
  identity: string;
  appearance: string;
  personality: string;
  goal: string;
  secret: string;
  routeId: string | null;
  notes: string;
}
```

Create `src/lib/domain/lore.ts`:

```ts
export type LoreCategory = 'location' | 'term' | 'world_rule' | 'event';

export interface LoreEntry {
  id: string;
  projectId: string;
  name: string;
  category: LoreCategory;
  description: string;
  tags: string[];
}
```

Create `src/lib/domain/variable.ts`:

```ts
export type VariableType = 'flag' | 'number';

export interface ProjectVariable {
  id: string;
  projectId: string;
  name: string;
  variableType: VariableType;
  defaultValue: number;
}
```

Create `src/lib/repositories/projectRepository.ts`:

```ts
import type { Project } from '../domain/project';

export interface ProjectRepository {
  listProjects(): Promise<Project[]>;
  getProject(projectId: string): Promise<Project | null>;
  createProject(input: { name: string; summary: string }): Promise<Project>;
  updateProject(project: Project): Promise<void>;
}
```

Create `src/lib/repositories/storyRepository.ts`:

```ts
import type { Scene } from '../domain/scene';
import type { SceneBlock } from '../domain/block';

export interface StoryRepository {
  listScenes(projectId: string): Promise<Scene[]>;
  createScene(input: Pick<Scene, 'projectId' | 'routeId' | 'title' | 'chapterLabel'>): Promise<Scene>;
  updateScene(scene: Scene): Promise<void>;
  saveBlocks(sceneId: string, blocks: SceneBlock[]): Promise<void>;
}
```

Create `src/lib/repositories/referenceRepository.ts`:

```ts
import type { Character } from '../domain/character';
import type { LoreEntry } from '../domain/lore';
import type { ProjectVariable } from '../domain/variable';

export interface ReferenceRepository {
  listCharacters(projectId: string): Promise<Character[]>;
  saveCharacter(character: Character): Promise<void>;
  listLoreEntries(projectId: string): Promise<LoreEntry[]>;
  saveLoreEntry(entry: LoreEntry): Promise<void>;
  listVariables(projectId: string): Promise<ProjectVariable[]>;
  saveVariable(variable: ProjectVariable): Promise<void>;
}
```

- [ ] **Step 4: 运行测试并补齐领域模型导出**

Run:

```bash
npm run test -- domain.test.ts
```

Expected:

```text
PASS src/lib/domain/domain.test.ts
```

如果缺少 `crypto.randomUUID()` 的测试环境支持，在 `src/test/setupTests.ts` 追加：

```ts
import '@testing-library/jest-dom';
import { webcrypto } from 'node:crypto';

Object.defineProperty(globalThis, 'crypto', {
  value: webcrypto,
});
```

- [ ] **Step 5: 提交领域模型与接口层**

Commit:

```bash
git add src/lib/domain src/lib/repositories src/test/setupTests.ts
git commit -m "feat: 建立 V1 统一领域模型与仓储接口"
```

### Task 3: 接入 SQLite 与数据库迁移

**Files:**
- Create: `src-tauri/src/migrations.rs`
- Modify: `src-tauri/src/lib.rs`
- Modify: `src-tauri/Cargo.toml`
- Modify: `src-tauri/tauri.conf.json`
- Create: `src/lib/db/database.ts`
- Create: `src/lib/db/schema.test.ts`

- [ ] **Step 1: 先写迁移配置的失败测试**

Create `src/lib/db/schema.test.ts`:

```ts
import { DATABASE_URL } from './database';

describe('database config', () => {
  it('使用本地 sqlite 文件作为默认数据库', () => {
    expect(DATABASE_URL).toBe('sqlite:vn-writer-lab.db');
  });
});
```

Run:

```bash
npm run test -- schema.test.ts
```

Expected: FAIL，提示缺少 `database.ts` 导出。

- [ ] **Step 2: 定义 SQLite 连接与前端数据库加载函数**

Create `src/lib/db/database.ts`:

```ts
import Database from '@tauri-apps/plugin-sql';

export const DATABASE_URL = 'sqlite:vn-writer-lab.db';

let dbPromise: Promise<Database> | null = null;

export function getDatabase() {
  if (!dbPromise) {
    dbPromise = Database.load(DATABASE_URL);
  }

  return dbPromise;
}
```

- [ ] **Step 3: 编写 Tauri SQL 插件迁移**

Create `src-tauri/src/migrations.rs`:

```rust
use tauri_plugin_sql::{Migration, MigrationKind};

pub fn build_migrations() -> Vec<Migration> {
    vec![
        Migration {
            version: 1,
            description: "create_v1_tables",
            kind: MigrationKind::Up,
            sql: r#"
            CREATE TABLE IF NOT EXISTS projects (
              id TEXT PRIMARY KEY,
              name TEXT NOT NULL,
              summary TEXT NOT NULL,
              project_type TEXT NOT NULL,
              status TEXT NOT NULL,
              created_at TEXT NOT NULL,
              updated_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS routes (
              id TEXT PRIMARY KEY,
              project_id TEXT NOT NULL,
              name TEXT NOT NULL,
              route_type TEXT NOT NULL,
              description TEXT NOT NULL,
              sort_order INTEGER NOT NULL,
              created_at TEXT NOT NULL,
              updated_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS scenes (
              id TEXT PRIMARY KEY,
              project_id TEXT NOT NULL,
              route_id TEXT NOT NULL,
              title TEXT NOT NULL,
              summary TEXT NOT NULL,
              scene_type TEXT NOT NULL,
              status TEXT NOT NULL,
              chapter_label TEXT NOT NULL,
              sort_order INTEGER NOT NULL,
              is_start_scene INTEGER NOT NULL,
              is_ending_scene INTEGER NOT NULL,
              notes TEXT NOT NULL,
              created_at TEXT NOT NULL,
              updated_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS scene_blocks (
              id TEXT PRIMARY KEY,
              scene_id TEXT NOT NULL,
              block_type TEXT NOT NULL,
              sort_order INTEGER NOT NULL,
              character_id TEXT,
              content_text TEXT NOT NULL,
              meta_json TEXT,
              created_at TEXT NOT NULL,
              updated_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS scene_links (
              id TEXT PRIMARY KEY,
              project_id TEXT NOT NULL,
              from_scene_id TEXT NOT NULL,
              to_scene_id TEXT NOT NULL,
              link_type TEXT NOT NULL,
              source_block_id TEXT,
              label TEXT NOT NULL,
              condition_id TEXT,
              priority_order INTEGER NOT NULL,
              created_at TEXT NOT NULL,
              updated_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS characters (
              id TEXT PRIMARY KEY,
              project_id TEXT NOT NULL,
              name TEXT NOT NULL,
              identity TEXT NOT NULL,
              appearance TEXT NOT NULL,
              personality TEXT NOT NULL,
              goal TEXT NOT NULL,
              secret TEXT NOT NULL,
              route_id TEXT,
              notes TEXT NOT NULL,
              created_at TEXT NOT NULL,
              updated_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS lore_entries (
              id TEXT PRIMARY KEY,
              project_id TEXT NOT NULL,
              name TEXT NOT NULL,
              category TEXT NOT NULL,
              description TEXT NOT NULL,
              tags_json TEXT NOT NULL,
              created_at TEXT NOT NULL,
              updated_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS project_variables (
              id TEXT PRIMARY KEY,
              project_id TEXT NOT NULL,
              name TEXT NOT NULL,
              variable_type TEXT NOT NULL,
              default_value INTEGER NOT NULL,
              created_at TEXT NOT NULL,
              updated_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS conditions (
              id TEXT PRIMARY KEY,
              project_id TEXT NOT NULL,
              variable_id TEXT NOT NULL,
              operator TEXT NOT NULL,
              compare_value INTEGER NOT NULL,
              created_at TEXT NOT NULL,
              updated_at TEXT NOT NULL
            );
            "#,
        }
    ]
}
```

- [ ] **Step 4: 注册 SQL 插件并配置预加载**

Modify `src-tauri/src/lib.rs`:

```rust
mod migrations;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:vn-writer-lab.db", migrations::build_migrations())
                .build(),
        )
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

Modify `src-tauri/Cargo.toml`:

```toml
[dependencies]
tauri = { version = "2", features = [] }
tauri-plugin-sql = { version = "2", features = ["sqlite"] }
serde = { version = "1", features = ["derive"] }
serde_json = "1"
```

Modify `src-tauri/tauri.conf.json`:

```json
{
  "plugins": {
    "sql": {
      "preload": ["sqlite:vn-writer-lab.db"]
    }
  }
}
```

- [ ] **Step 5: 运行验证并提交**

Run:

```bash
npm run test -- schema.test.ts
npm run tauri dev
```

Expected:

```text
Vitest: PASS 1 test
Tauri dev: 正常启动，日志中无 SQL 插件初始化错误
```

Commit:

```bash
git add src/lib/db src-tauri/src/lib.rs src-tauri/src/migrations.rs src-tauri/Cargo.toml src-tauri/tauri.conf.json
git commit -m "feat: 接入 sqlite 持久化与数据库迁移"
```

### Task 4: 实现项目首页与项目创建流程

**Files:**
- Create: `src/features/projects/pages/ProjectHomePage.tsx`
- Create: `src/features/projects/components/ProjectCreateForm.tsx`
- Create: `src/features/projects/store/useProjectStore.ts`
- Create: `src/features/projects/pages/ProjectHomePage.test.tsx`
- Modify: `src/main.tsx`

- [ ] **Step 1: 先写项目创建流程的失败测试**

Create `src/features/projects/pages/ProjectHomePage.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProjectHomePage } from './ProjectHomePage';

describe('ProjectHomePage', () => {
  it('允许创建新项目并显示项目简介', async () => {
    const user = userEvent.setup();
    render(<ProjectHomePage />);

    await user.type(screen.getByLabelText('项目名称'), '雨夜回响');
    await user.type(screen.getByLabelText('一句话简介'), '一段校园悬疑故事');
    await user.click(screen.getByRole('button', { name: '创建项目' }));

    expect(screen.getByText('雨夜回响')).toBeInTheDocument();
    expect(screen.getByText('一段校园悬疑故事')).toBeInTheDocument();
  });
});
```

Run:

```bash
npm run test -- ProjectHomePage.test.tsx
```

Expected: FAIL，提示页面与表单未实现。

- [ ] **Step 2: 实现项目状态仓库**

Create `src/features/projects/store/useProjectStore.ts`:

```ts
import { create } from 'zustand';
import { createEmptyProject, type Project } from '../../../lib/domain/project';

interface ProjectState {
  currentProject: Project | null;
  createProject: (name: string, summary: string) => void;
}

export const useProjectStore = create<ProjectState>((set) => ({
  currentProject: null,
  createProject: (name, summary) =>
    set({
      currentProject: createEmptyProject(name, summary),
    }),
}));
```

- [ ] **Step 3: 实现项目创建表单与首页**

Create `src/features/projects/components/ProjectCreateForm.tsx`:

```tsx
import { FormEvent, useState } from 'react';

interface ProjectCreateFormProps {
  onSubmit: (name: string, summary: string) => void;
}

export function ProjectCreateForm({ onSubmit }: ProjectCreateFormProps) {
  const [name, setName] = useState('');
  const [summary, setSummary] = useState('');

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit(name, summary);
  }

  return (
    <form onSubmit={handleSubmit}>
      <label>
        项目名称
        <input value={name} onChange={(event) => setName(event.target.value)} />
      </label>
      <label>
        一句话简介
        <textarea value={summary} onChange={(event) => setSummary(event.target.value)} />
      </label>
      <button type="submit">创建项目</button>
    </form>
  );
}
```

Create `src/features/projects/pages/ProjectHomePage.tsx`:

```tsx
import { ProjectCreateForm } from '../components/ProjectCreateForm';
import { useProjectStore } from '../store/useProjectStore';

export function ProjectHomePage() {
  const currentProject = useProjectStore((state) => state.currentProject);
  const createProject = useProjectStore((state) => state.createProject);

  return (
    <section>
      <h2>项目首页</h2>
      {!currentProject ? (
        <ProjectCreateForm onSubmit={createProject} />
      ) : (
        <div>
          <h3>{currentProject.name}</h3>
          <p>{currentProject.summary}</p>
          <p>默认路线：{currentProject.routes[0]?.name}</p>
        </div>
      )}
    </section>
  );
}
```

- [ ] **Step 4: 挂载首页路由并运行测试**

Modify `src/main.tsx`:

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { AppShell } from './app/layouts/AppShell';
import { ProjectHomePage } from './features/projects/pages/ProjectHomePage';
import './styles.css';

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [{ index: true, element: <ProjectHomePage /> }],
  },
]);

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);
```

Run:

```bash
npm run test -- ProjectHomePage.test.tsx
```

Expected:

```text
PASS src/features/projects/pages/ProjectHomePage.test.tsx
```

- [ ] **Step 5: 提交项目首页能力**

Commit:

```bash
git add src/main.tsx src/features/projects
git commit -m "feat: 实现项目首页与项目创建流程"
```

### Task 5: 实现场景树与基础剧情编辑器

**Files:**
- Create: `src/features/editor/pages/EditorPage.tsx`
- Create: `src/features/editor/components/SceneTree.tsx`
- Create: `src/features/editor/components/SceneBlockList.tsx`
- Create: `src/features/editor/store/useEditorStore.ts`
- Create: `src/features/editor/pages/EditorPage.test.tsx`
- Modify: `src/main.tsx`

- [ ] **Step 1: 先写编辑器的失败测试**

Create `src/features/editor/pages/EditorPage.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EditorPage } from './EditorPage';

describe('EditorPage', () => {
  it('允许创建场景并追加旁白块', async () => {
    const user = userEvent.setup();
    render(<EditorPage />);

    await user.click(screen.getByRole('button', { name: '新建场景' }));
    await user.click(screen.getByRole('button', { name: '新增旁白' }));

    expect(screen.getByText('未命名场景 1')).toBeInTheDocument();
    expect(screen.getByLabelText('旁白内容')).toBeInTheDocument();
  });
});
```

Run:

```bash
npm run test -- EditorPage.test.tsx
```

Expected: FAIL，提示编辑器页面缺失。

- [ ] **Step 2: 实现场景编辑状态**

Create `src/features/editor/store/useEditorStore.ts`:

```ts
import { create } from 'zustand';
import type { Scene } from '../../../lib/domain/scene';
import type { SceneBlock } from '../../../lib/domain/block';

interface EditorState {
  scenes: Scene[];
  selectedSceneId: string | null;
  createScene: () => void;
  addBlock: (blockType: SceneBlock['blockType']) => void;
}

export const useEditorStore = create<EditorState>((set, get) => ({
  scenes: [],
  selectedSceneId: null,
  createScene: () => {
    const nextIndex = get().scenes.length + 1;
    const sceneId = crypto.randomUUID();

    set({
      scenes: [
        ...get().scenes,
        {
          id: sceneId,
          projectId: 'local-project',
          routeId: 'default-route',
          title: `未命名场景 ${nextIndex}`,
          summary: '',
          sceneType: 'normal',
          status: 'draft',
          chapterLabel: '',
          sortOrder: nextIndex - 1,
          isStartScene: nextIndex === 1,
          isEndingScene: false,
          notes: '',
          blocks: [],
        },
      ],
      selectedSceneId: sceneId,
    });
  },
  addBlock: (blockType) => {
    const { scenes, selectedSceneId } = get();
    if (!selectedSceneId) return;

    set({
      scenes: scenes.map((scene) =>
        scene.id === selectedSceneId
          ? {
              ...scene,
              blocks: [
                ...scene.blocks,
                {
                  id: crypto.randomUUID(),
                  sceneId: scene.id,
                  blockType,
                  sortOrder: scene.blocks.length,
                  characterId: null,
                  contentText: '',
                  metaJson: null,
                },
              ],
            }
          : scene,
      ),
    });
  },
}));
```

- [ ] **Step 3: 实现场景树与块列表**

Create `src/features/editor/components/SceneTree.tsx`:

```tsx
import type { Scene } from '../../../lib/domain/scene';

interface SceneTreeProps {
  scenes: Scene[];
  onCreateScene: () => void;
}

export function SceneTree({ scenes, onCreateScene }: SceneTreeProps) {
  return (
    <aside>
      <button onClick={onCreateScene}>新建场景</button>
      <ul>
        {scenes.map((scene) => (
          <li key={scene.id}>{scene.title}</li>
        ))}
      </ul>
    </aside>
  );
}
```

Create `src/features/editor/components/SceneBlockList.tsx`:

```tsx
import type { SceneBlock } from '../../../lib/domain/block';

interface SceneBlockListProps {
  blocks: SceneBlock[];
}

export function SceneBlockList({ blocks }: SceneBlockListProps) {
  return (
    <div>
      {blocks.map((block) => (
        <label key={block.id}>
          {block.blockType === 'narration' ? '旁白内容' : '内容'}
          <textarea value={block.contentText} readOnly />
        </label>
      ))}
    </div>
  );
}
```

Create `src/features/editor/pages/EditorPage.tsx`:

```tsx
import { SceneBlockList } from '../components/SceneBlockList';
import { SceneTree } from '../components/SceneTree';
import { useEditorStore } from '../store/useEditorStore';

export function EditorPage() {
  const scenes = useEditorStore((state) => state.scenes);
  const selectedSceneId = useEditorStore((state) => state.selectedSceneId);
  const createScene = useEditorStore((state) => state.createScene);
  const addBlock = useEditorStore((state) => state.addBlock);

  const selectedScene = scenes.find((scene) => scene.id === selectedSceneId) ?? null;

  return (
    <section>
      <h2>剧情编辑</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '16px' }}>
        <SceneTree scenes={scenes} onCreateScene={createScene} />
        <div>
          <button onClick={() => addBlock('narration')}>新增旁白</button>
          <button onClick={() => addBlock('dialogue')}>新增对白</button>
          <button onClick={() => addBlock('note')}>新增注释</button>
          {selectedScene ? <SceneBlockList blocks={selectedScene.blocks} /> : <p>请选择或创建一个场景。</p>}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: 挂载编辑页并运行测试**

Modify `src/main.tsx` children:

```tsx
children: [
  { index: true, element: <ProjectHomePage /> },
  { path: 'editor', element: <EditorPage /> },
],
```

Run:

```bash
npm run test -- EditorPage.test.tsx
```

Expected:

```text
PASS src/features/editor/pages/EditorPage.test.tsx
```

- [ ] **Step 5: 提交基础编辑器**

Commit:

```bash
git add src/main.tsx src/features/editor
git commit -m "feat: 实现场景树与基础剧情编辑器"
```

### Task 6: 实现选项块、条件变量与场景跳转

**Files:**
- Create: `src/features/editor/components/ChoiceBlockEditor.tsx`
- Create: `src/features/editor/components/ConditionBlockEditor.tsx`
- Create: `src/features/editor/store/linkUtils.ts`
- Create: `src/features/editor/store/linkUtils.test.ts`
- Modify: `src/features/editor/store/useEditorStore.ts`
- Modify: `src/features/editor/components/SceneBlockList.tsx`

- [ ] **Step 1: 先写跳转关系的失败测试**

Create `src/features/editor/store/linkUtils.test.ts`:

```ts
import { buildChoiceLink } from './linkUtils';

describe('buildChoiceLink', () => {
  it('根据选项块生成 choice 类型连接', () => {
    const link = buildChoiceLink({
      projectId: 'p1',
      fromSceneId: 's1',
      toSceneId: 's2',
      sourceBlockId: 'b1',
      label: '去旧校舍',
    });

    expect(link.linkType).toBe('choice');
    expect(link.label).toBe('去旧校舍');
    expect(link.fromSceneId).toBe('s1');
    expect(link.toSceneId).toBe('s2');
  });
});
```

Run:

```bash
npm run test -- linkUtils.test.ts
```

Expected: FAIL，提示 `buildChoiceLink` 不存在。

- [ ] **Step 2: 实现连接构建工具**

Create `src/features/editor/store/linkUtils.ts`:

```ts
export interface SceneLink {
  id: string;
  projectId: string;
  fromSceneId: string;
  toSceneId: string;
  linkType: 'default' | 'choice' | 'conditional' | 'fallback';
  sourceBlockId: string | null;
  label: string;
  conditionId: string | null;
  priorityOrder: number;
}

export function buildChoiceLink(input: {
  projectId: string;
  fromSceneId: string;
  toSceneId: string;
  sourceBlockId: string;
  label: string;
}): SceneLink {
  return {
    id: crypto.randomUUID(),
    projectId: input.projectId,
    fromSceneId: input.fromSceneId,
    toSceneId: input.toSceneId,
    linkType: 'choice',
    sourceBlockId: input.sourceBlockId,
    label: input.label,
    conditionId: null,
    priorityOrder: 0,
  };
}
```

- [ ] **Step 3: 扩展编辑器以支持 choice / condition block**

Modify `src/features/editor/store/useEditorStore.ts`，为 `EditorState` 增加 `links` 与 `variables`：

```ts
import { create } from 'zustand';
import type { Scene } from '../../../lib/domain/scene';
import type { SceneBlock } from '../../../lib/domain/block';
import type { ProjectVariable } from '../../../lib/domain/variable';
import type { SceneLink } from './linkUtils';

interface EditorState {
  scenes: Scene[];
  selectedSceneId: string | null;
  links: SceneLink[];
  variables: ProjectVariable[];
  createScene: () => void;
  addBlock: (blockType: SceneBlock['blockType']) => void;
}

export const useEditorStore = create<EditorState>((set, get) => ({
  scenes: [],
  selectedSceneId: null,
  links: [],
  variables: [],
  createScene: () => {
    const nextIndex = get().scenes.length + 1;
    const sceneId = crypto.randomUUID();

    set({
      scenes: [
        ...get().scenes,
        {
          id: sceneId,
          projectId: 'local-project',
          routeId: 'default-route',
          title: `未命名场景 ${nextIndex}`,
          summary: '',
          sceneType: 'normal',
          status: 'draft',
          chapterLabel: '',
          sortOrder: nextIndex - 1,
          isStartScene: nextIndex === 1,
          isEndingScene: false,
          notes: '',
          blocks: [],
        },
      ],
      selectedSceneId: sceneId,
    });
  },
  addBlock: (blockType) => {
    const { scenes, selectedSceneId } = get();
    if (!selectedSceneId) return;

    set({
      scenes: scenes.map((scene) =>
        scene.id === selectedSceneId
          ? {
              ...scene,
              blocks: [
                ...scene.blocks,
                {
                  id: crypto.randomUUID(),
                  sceneId: scene.id,
                  blockType,
                  sortOrder: scene.blocks.length,
                  characterId: null,
                  contentText: '',
                  metaJson: null,
                },
              ],
            }
          : scene,
      ),
    });
  },
}));
```

Create `src/features/editor/components/ChoiceBlockEditor.tsx`:

```tsx
export function ChoiceBlockEditor() {
  return (
    <fieldset>
      <legend>选项块</legend>
      <label>
        选项文案
        <input aria-label="选项文案" />
      </label>
      <label>
        跳转场景
        <input aria-label="跳转场景" />
      </label>
    </fieldset>
  );
}
```

Create `src/features/editor/components/ConditionBlockEditor.tsx`:

```tsx
export function ConditionBlockEditor() {
  return (
    <fieldset>
      <legend>条件块</legend>
      <label>
        条件变量
        <input aria-label="条件变量" />
      </label>
      <label>
        比较值
        <input aria-label="比较值" type="number" />
      </label>
    </fieldset>
  );
}
```

Modify `src/features/editor/components/SceneBlockList.tsx`:

```tsx
import { ChoiceBlockEditor } from './ChoiceBlockEditor';
import { ConditionBlockEditor } from './ConditionBlockEditor';

export function SceneBlockList({ blocks }: SceneBlockListProps) {
  return (
    <div>
      {blocks.map((block) => {
        if (block.blockType === 'choice') {
          return <ChoiceBlockEditor key={block.id} />;
        }

        if (block.blockType === 'condition') {
          return <ConditionBlockEditor key={block.id} />;
        }

        return (
          <label key={block.id}>
            {block.blockType === 'narration' ? '旁白内容' : '内容'}
            <textarea value={block.contentText} readOnly />
          </label>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 4: 运行测试并补充按钮**

Modify `src/features/editor/pages/EditorPage.tsx`:

```tsx
<button onClick={() => addBlock('choice')}>新增选项</button>
<button onClick={() => addBlock('condition')}>新增条件</button>
```

Run:

```bash
npm run test -- linkUtils.test.ts
npm run test -- EditorPage.test.tsx
```

Expected:

```text
PASS src/features/editor/store/linkUtils.test.ts
PASS src/features/editor/pages/EditorPage.test.tsx
```

- [ ] **Step 5: 提交分支逻辑基础能力**

Commit:

```bash
git add src/features/editor
git commit -m "feat: 实现选项块 条件块与场景跳转基础"
```

### Task 7: 实现分支图页与结构筛选

**Files:**
- Create: `src/features/graph/pages/GraphPage.tsx`
- Create: `src/features/graph/components/GraphFilters.tsx`
- Create: `src/features/graph/components/SceneGraphCanvas.tsx`
- Create: `src/features/graph/pages/GraphPage.test.tsx`
- Modify: `src/main.tsx`

- [ ] **Step 1: 先写分支图渲染失败测试**

Create `src/features/graph/pages/GraphPage.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { GraphPage } from './GraphPage';

describe('GraphPage', () => {
  it('显示结构图页标题与问题筛选入口', () => {
    render(<GraphPage />);

    expect(screen.getByRole('heading', { name: '分支图' })).toBeInTheDocument();
    expect(screen.getByLabelText('只看问题节点')).toBeInTheDocument();
  });
});
```

Run:

```bash
npm run test -- GraphPage.test.tsx
```

Expected: FAIL，提示页面未实现。

- [ ] **Step 2: 实现筛选面板**

Create `src/features/graph/components/GraphFilters.tsx`:

```tsx
export function GraphFilters() {
  return (
    <form>
      <label>
        路线筛选
        <select aria-label="路线筛选">
          <option value="all">全部路线</option>
          <option value="common">共通线</option>
        </select>
      </label>
      <label>
        <input type="checkbox" aria-label="只看问题节点" />
        只看问题节点
      </label>
    </form>
  );
}
```

- [ ] **Step 3: 实现基础图画布与页面**

Create `src/features/graph/components/SceneGraphCanvas.tsx`:

```tsx
import ReactFlow, { Background, Controls } from 'reactflow';
import 'reactflow/dist/style.css';

const nodes = [
  { id: 's1', position: { x: 0, y: 0 }, data: { label: '开始场景' }, type: 'default' },
  { id: 's2', position: { x: 220, y: 0 }, data: { label: '分支场景' }, type: 'default' },
];

const edges = [{ id: 'e1-2', source: 's1', target: 's2', label: '继续前进' }];

export function SceneGraphCanvas() {
  return (
    <div style={{ height: 480 }}>
      <ReactFlow nodes={nodes} edges={edges} fitView>
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
}
```

Create `src/features/graph/pages/GraphPage.tsx`:

```tsx
import { GraphFilters } from '../components/GraphFilters';
import { SceneGraphCanvas } from '../components/SceneGraphCanvas';

export function GraphPage() {
  return (
    <section>
      <h2>分支图</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '16px' }}>
        <GraphFilters />
        <SceneGraphCanvas />
      </div>
    </section>
  );
}
```

- [ ] **Step 4: 挂载分支图路由并运行测试**

Modify `src/main.tsx` children:

```tsx
{ path: 'graph', element: <GraphPage /> },
```

Run:

```bash
npm run test -- GraphPage.test.tsx
```

Expected:

```text
PASS src/features/graph/pages/GraphPage.test.tsx
```

- [ ] **Step 5: 提交分支图页**

Commit:

```bash
git add src/main.tsx src/features/graph
git commit -m "feat: 实现分支图页面与结构筛选"
```

### Task 8: 实现角色页与设定页

**Files:**
- Create: `src/features/characters/pages/CharactersPage.tsx`
- Create: `src/features/characters/pages/CharactersPage.test.tsx`
- Create: `src/features/lore/pages/LorePage.tsx`
- Create: `src/features/lore/pages/LorePage.test.tsx`
- Modify: `src/main.tsx`

- [ ] **Step 1: 先写角色页与设定页失败测试**

Create `src/features/characters/pages/CharactersPage.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { CharactersPage } from './CharactersPage';

describe('CharactersPage', () => {
  it('显示角色页标题与新增按钮', () => {
    render(<CharactersPage />);
    expect(screen.getByRole('heading', { name: '角色' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '新增角色' })).toBeInTheDocument();
  });
});
```

Create `src/features/lore/pages/LorePage.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { LorePage } from './LorePage';

describe('LorePage', () => {
  it('显示设定页标题与分类入口', () => {
    render(<LorePage />);
    expect(screen.getByRole('heading', { name: '设定' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: '地点' })).toBeInTheDocument();
  });
});
```

Run:

```bash
npm run test -- CharactersPage.test.tsx
npm run test -- LorePage.test.tsx
```

Expected: FAIL。

- [ ] **Step 2: 实现角色页**

Create `src/features/characters/pages/CharactersPage.tsx`:

```tsx
export function CharactersPage() {
  return (
    <section>
      <h2>角色</h2>
      <button type="button">新增角色</button>
      <article>
        <h3>角色详情</h3>
        <label>
          姓名
          <input />
        </label>
        <label>
          身份
          <input />
        </label>
        <label>
          性格
          <textarea />
        </label>
      </article>
    </section>
  );
}
```

- [ ] **Step 3: 实现设定页**

Create `src/features/lore/pages/LorePage.tsx`:

```tsx
export function LorePage() {
  return (
    <section>
      <h2>设定</h2>
      <div role="tablist" aria-label="设定分类">
        <button role="tab">地点</button>
        <button role="tab">术语</button>
        <button role="tab">世界规则</button>
        <button role="tab">事件</button>
      </div>
      <article>
        <h3>设定详情</h3>
        <label>
          名称
          <input />
        </label>
        <label>
          描述
          <textarea />
        </label>
      </article>
    </section>
  );
}
```

- [ ] **Step 4: 挂载路由并运行测试**

Modify `src/main.tsx` children:

```tsx
{ path: 'characters', element: <CharactersPage /> },
{ path: 'lore', element: <LorePage /> },
```

Run:

```bash
npm run test -- CharactersPage.test.tsx
npm run test -- LorePage.test.tsx
```

Expected:

```text
PASS src/features/characters/pages/CharactersPage.test.tsx
PASS src/features/lore/pages/LorePage.test.tsx
```

- [ ] **Step 5: 提交资料页**

Commit:

```bash
git add src/main.tsx src/features/characters src/features/lore
git commit -m "feat: 实现角色页与设定页基础能力"
```

### Task 9: 实现预览引擎与路径推进

**Files:**
- Create: `src/features/preview/lib/previewEngine.ts`
- Create: `src/features/preview/lib/previewEngine.test.ts`
- Create: `src/features/preview/pages/PreviewPage.tsx`
- Modify: `src/main.tsx`

- [ ] **Step 1: 先写预览推进失败测试**

Create `src/features/preview/lib/previewEngine.test.ts`:

```ts
import { resolveNextSceneId } from './previewEngine';

describe('resolveNextSceneId', () => {
  it('根据选项标签返回下一个场景 id', () => {
    const nextSceneId = resolveNextSceneId(
      [
        {
          id: 'l1',
          projectId: 'p1',
          fromSceneId: 's1',
          toSceneId: 's2',
          linkType: 'choice',
          sourceBlockId: 'b1',
          label: '去旧校舍',
          conditionId: null,
          priorityOrder: 0,
        },
      ],
      's1',
      '去旧校舍',
    );

    expect(nextSceneId).toBe('s2');
  });
});
```

Run:

```bash
npm run test -- previewEngine.test.ts
```

Expected: FAIL。

- [ ] **Step 2: 实现预览引擎纯函数**

Create `src/features/preview/lib/previewEngine.ts`:

```ts
import type { SceneLink } from '../../editor/store/linkUtils';

export function resolveNextSceneId(
  links: SceneLink[],
  currentSceneId: string,
  selectedLabel: string,
) {
  const nextLink = links.find(
    (link) =>
      link.fromSceneId === currentSceneId &&
      link.linkType === 'choice' &&
      link.label === selectedLabel,
  );

  return nextLink?.toSceneId ?? null;
}
```

- [ ] **Step 3: 实现预览页**

Create `src/features/preview/pages/PreviewPage.tsx`:

```tsx
export function PreviewPage() {
  return (
    <section>
      <h2>预览</h2>
      <div>
        <button type="button">从开头预览</button>
        <button type="button">从当前节点预览</button>
      </div>
      <article>
        <h3>当前场景</h3>
        <p>这里展示当前场景内容与可选项。</p>
      </article>
    </section>
  );
}
```

- [ ] **Step 4: 挂载路由并运行测试**

Modify `src/main.tsx` children:

```tsx
{ path: 'preview', element: <PreviewPage /> },
```

Run:

```bash
npm run test -- previewEngine.test.ts
```

Expected:

```text
PASS src/features/preview/lib/previewEngine.test.ts
```

- [ ] **Step 5: 提交预览基础能力**

Commit:

```bash
git add src/main.tsx src/features/preview
git commit -m "feat: 实现预览引擎与路径推进基础"
```

### Task 10: 自动保存、验收测试与交付收尾

**Files:**
- Create: `src/lib/store/useAutoSaveStore.ts`
- Create: `src/test/app.acceptance.test.tsx`
- Create: `README.md`
- Modify: `src/main.tsx`

- [ ] **Step 1: 先写端到端式验收失败测试**

Create `src/test/app.acceptance.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';
import { AppShell } from '../app/layouts/AppShell';

describe('V1 acceptance smoke', () => {
  it('导航中包含 V1 六个核心页面', () => {
    const router = createMemoryRouter([
      {
        path: '/',
        element: <AppShell />,
        children: [{ index: true, element: <div>项目首页</div> }],
      },
    ]);

    render(<RouterProvider router={router} />);

    expect(screen.getByText('项目首页')).toBeInTheDocument();
    expect(screen.getByText('剧情编辑')).toBeInTheDocument();
    expect(screen.getByText('分支图')).toBeInTheDocument();
    expect(screen.getByText('角色')).toBeInTheDocument();
    expect(screen.getByText('设定')).toBeInTheDocument();
    expect(screen.getByText('预览')).toBeInTheDocument();
  });
});
```

Run:

```bash
npm run test -- app.acceptance.test.tsx
```

Expected: 如果此前路由或导航有遗漏，则 FAIL。

- [ ] **Step 2: 实现自动保存状态层**

Create `src/lib/store/useAutoSaveStore.ts`:

```ts
import { create } from 'zustand';

interface AutoSaveState {
  lastSavedAt: string | null;
  markSaved: () => void;
}

export const useAutoSaveStore = create<AutoSaveState>((set) => ({
  lastSavedAt: null,
  markSaved: () => set({ lastSavedAt: new Date().toISOString() }),
}));
```

- [ ] **Step 3: 在入口处挂载自动保存提示与项目说明**

Modify `src/main.tsx`，在布局页或根组件中追加自动保存提示：

```tsx
<footer style={{ marginTop: '24px', color: '#6b7280' }}>
  当前版本：V1 桌面创作闭环验证版
</footer>
```

Create `README.md`:

````md
# VN 写作工具 V1

## 本地开发

```bash
npm install
npm run tauri dev
```

## 测试

```bash
npm run test
```

## V1 范围

- 项目创建
- 剧情编辑
- 分支图
- 角色
- 设定
- 预览
````

- [ ] **Step 4: 运行完整验证**

Run:

```bash
npm run test
npm run build
npm run tauri build
```

Expected:

```text
Vitest: 全量 PASS
Vite build: 成功输出 dist
Tauri build: 成功生成桌面应用构建产物
```

- [ ] **Step 5: 提交收尾改动**

Commit:

```bash
git add README.md src/lib/store/useAutoSaveStore.ts src/test/app.acceptance.test.tsx src/main.tsx
git commit -m "chore: 完成 V1 验收测试与交付收尾"
```

## 执行顺序说明

严格按 Task 1 → Task 10 顺序执行，不要并行跳步。原因如下：

1. Task 1 先建立脚手架与测试基线。
2. Task 2 与 Task 3 锁定领域模型和持久化底座。
3. Task 4 到 Task 9 在统一模型上逐步补齐页面和能力。
4. Task 10 只在前面模块稳定后进行收尾与验收。

## 验证总表

每完成一个 Task，都至少执行对应的局部测试。完成全部任务后，必须执行以下最终验证：

```bash
npm run test
npm run build
npm run tauri build
```

若任一命令失败，停止继续推进，先回到最近一个 Task 修复问题，再重新运行完整验证。

## 风险提醒

1. 如果 `npm create tauri-app@latest` 生成的默认文件名与计划不一致，优先保留官方生成结构，再把计划中的业务文件按职责映射进去。
2. 如果 Tauri SQL 插件在当前环境初始化失败，不要绕过数据库，先修正插件与 SQLite 运行依赖。
3. 如果 React Flow 与当前样式系统冲突，先保证节点与连线可读，不要提前做复杂视觉优化。
4. 如果 `tauri build` 失败但前端测试已通过，仍然不能算完成，必须以桌面构建成功为准。
