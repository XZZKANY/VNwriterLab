## 项目上下文摘要（V1 角色关联展示）

生成时间：2026-04-06  
任务目标：为角色详情页补齐“与路线和场景的关联展示”最小闭环，只做展示，不做复杂编辑或批量管理。

### 1. 相似实现分析

- **实现1**: `src/features/characters/pages/CharactersPage.tsx`
  - 模式：角色列表 + 详情编辑的单页派生展示。
  - 可复用：`currentProject`、`useCharacterStore`、选择角色后直接渲染详情。
  - 需注意：当前详情面板没有任何关联信息展示入口。
- **实现2**: `src/features/graph/pages/GraphPage.tsx`
  - 模式：从 store 直接派生图数据，再渲染摘要列表。
  - 可复用：先计算派生数据，再在页面中按列表/摘要呈现。
  - 需注意：适合“最小展示”，不需要引入复杂编辑控件。
- **实现3**: `src/features/preview/pages/PreviewPage.tsx`
  - 模式：从 editor store 读取场景与连线，再按运行时状态展示结果。
  - 可复用：基于 `scenes` / `blocks` / `links` 做只读解析。
  - 需注意：说明 editor store 中的场景与 block 数据是可用于展示关联关系的真实来源。

### 2. 项目约定

- **命名约定**: 组件与页面使用 PascalCase，store hook 以 `useXxxStore` 命名，局部派生变量用英文描述性名词。
- **文件组织**: 页面与测试文件同目录并成对出现；领域模型放在 `src/lib/domain`；状态放在 `src/features/*/store`。
- **导入顺序**: 第三方库优先，其次内部模块；现有代码中同类文件保持稳定导入顺序即可。
- **代码风格**: 以函数组件为主，页面内用 `useStore(selector)` 直接派生，不额外引入不必要的抽象。

### 3. 可复用组件清单

- `src/features/projects/store/useProjectStore.ts`: 提供 `currentProject.routes` 与 `currentProject.scenes`。
- `src/features/editor/store/useEditorStore.ts`: 提供 `scenes`、`blocks`、`selectedSceneId`，可用于统计角色被哪些场景块引用。
- `src/lib/domain/character.ts`: 角色模型已有 `routeId`，无需扩展数据结构即可做路线关联展示。
- `src/features/characters/store/useCharacterStore.ts`: 角色 CRUD 与选中状态来源。

### 4. 测试策略

- **测试框架**: Vitest + Testing Library + user-event。
- **测试模式**: 页面渲染测试，结合 `store.setState()` 构造场景数据。
- **参考文件**: `src/features/characters/pages/CharactersPage.test.tsx`、`src/features/graph/pages/GraphPage.test.tsx`、`src/features/preview/pages/PreviewPage.test.tsx`。
- **覆盖要求**: 新增“关联展示”标题/摘要、角色有无 `routeId` 两种路径、基于 `characterId` 的场景引用列表或计数。

### 5. 依赖和集成点

- **外部依赖**: React、Zustand、Vitest、Testing Library。
- **内部依赖**: `useProjectStore.currentProject.routes`、`useEditorStore.scenes`、`SceneBlock.characterId`、`Character.routeId`。
- **集成方式**: 页面内直接派生，只读展示，不修改 store 数据流。
- **配置来源**: 项目 store 与 editor store 的持久化状态。

### 6. 技术选型理由

- **为什么用这个方案**: 角色详情页已经是角色信息的唯一入口，在此处加入只读关联摘要是最小闭环，改动范围最小。
- **优势**: 不新增数据模型，不引入编辑交互，不影响现有角色创建/编辑流程。
- **劣势和风险**: 角色 `routeId` 与场景 `characterId` 目前都属于弱关联，页面只能做展示，不做联动校验。

### 7. 关键风险点

- **并发问题**: 当前任务无并发写入新逻辑，主要风险是不同 store 的持久化状态不同步。
- **边界条件**: 角色未关联路线、项目内无场景、场景块未设置 `characterId`、关联指向已删除对象。
- **性能瓶颈**: 页面渲染时需遍历当前项目场景及块，数据量大时应保持一次性派生并避免重复计算。
- **安全考虑**: 本任务不涉及新增安全机制。
