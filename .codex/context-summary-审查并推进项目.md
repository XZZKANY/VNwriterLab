## 项目上下文摘要（审查并推进项目）

生成时间：2026-04-07 12:49:44

### 1. 相似实现分析

- **实现1**: `src/features/projects/pages/ProjectHomePage.tsx`
  - 模式：项目首页负责汇总展示项目状态、最近编辑、搜索与统计，不承载复杂业务写入
  - 可复用：最近编辑区块的状态文案映射、项目统计和搜索入口
  - 需注意：状态展示目前用本地 `sceneStatusLabelMap`，新增状态时必须同步这里

- **实现2**: `src/features/editor/pages/EditorPage.tsx`
  - 模式：页面层只保留最小受控表单和回调，真实写入委托给 store
  - 可复用：场景基础信息编辑区、状态下拉框、`handleSceneUpdate`
  - 需注意：`status` 类型断言当前只列出三态，补齐状态时这里是直接改动点

- **实现3**: `src/features/projects/store/useProjectStore.ts`
  - 模式：项目结构变更集中在 Zustand store，页面不直接改数据
  - 可复用：`updateScene` 的 `Partial<Pick<Scene, ...>>` 同步写法、`syncEditorScenes`
  - 需注意：状态只是既有字段之一，扩展枚举时不应引入额外 store 或额外同步层

- **实现4**: `src/features/editor/store/useEditorStore.ts`
  - 模式：编辑态场景、变量、块内容都由同一 store 原子更新并持久化
  - 可复用：`updateScene` 与默认场景创建逻辑
  - 需注意：默认新建场景状态目前是 `draft`，本轮不应改变默认值，只扩展可选值

- **实现5**: `src/lib/domain/scene.ts` 与 `src/lib/domain/project.ts`
  - 模式：领域模型先定义联合类型，再由工厂函数提供默认值
  - 可复用：`SceneStatus` 联合类型、`createSceneInRoute` / `createTemplateScene`
  - 需注意：路线图要求的五态缺口应优先在领域层补齐，避免页面层各自发散

### 2. 项目约定

- **命名约定**: 组件使用 PascalCase，store action 与辅助函数使用动词式 camelCase，类型导入优先 `import type`
- **文件组织**: React 页面位于 `features/*/pages`，纯派生逻辑位于 `features/*/lib`，领域类型位于 `src/lib/domain`
- **导入顺序**: 先第三方库，再应用层模块，样式最后导入
- **代码风格**: Zustand store 负责真实写入，页面层只做最小受控表单；联合类型与字面量值直接在 TypeScript 中表达

### 3. 可复用组件清单

- `src/lib/domain/scene.ts`：场景状态类型源
- `src/lib/domain/project.ts`：默认创建场景与模板场景工厂
- `src/features/projects/store/useProjectStore.ts`：项目场景更新与 editor 同步
- `src/features/editor/store/useEditorStore.ts`：本地编辑场景更新与持久化
- `src/features/editor/pages/EditorPage.tsx`：状态编辑入口
- `src/features/projects/pages/ProjectHomePage.tsx`：状态展示入口

### 4. 测试策略

- **测试框架**: Vitest + Testing Library
- **测试模式**: 页面交互测试 + store/持久化回归测试
- **参考文件**:
  - `src/features/editor/pages/EditorPage.test.tsx`
  - `src/features/projects/pages/ProjectHomePage.test.tsx`
  - `src/lib/store/persistence.test.ts`
  - `src/features/projects/lib/projectStats.test.ts`
- **覆盖重点**:
  - 编辑页可切换并保存新增状态
  - 项目首页最近编辑能显示新增状态中文文案
  - 持久化恢复不受新增状态破坏
  - 默认新建场景仍为 `draft`

### 5. 依赖和集成点

- **外部依赖**: React 19、React Router 7、Zustand 5、Vitest 4、Testing Library
- **内部依赖**: `useProjectStore` 与 `useEditorStore` 共享 `Scene` 结构；首页和编辑页消费同一状态字段
- **集成方式**: 领域模型扩展状态联合类型，页面层扩展选项与文案，store 同步逻辑保持不变
- **配置来源**: `package.json` 定义 `test` 与 `build` 脚本，`vitest.config.ts` 使用 `jsdom`

### 6. 技术选型理由

- **为什么用这个方案**: 状态管理缺口有明确产品依据（路线图）和明确代码落点（领域模型 + 两个页面），是当前最小且高价值的推进项
- **优势**: 改动面小、风险可控、与既有架构完全一致、能直接补齐 V1.5 已声明能力
- **劣势和风险**: 状态值是跨页面共享字段，若有遗漏的字面量断言或测试样例，容易出现编译或测试失败

### 7. 关键风险点

- **一致性风险**: 扩展 `SceneStatus` 后，所有直接列举状态的 select、label map、测试断言都必须同步
- **边界条件**: 旧数据只包含三态，新代码必须兼容三态持久化并允许新增两态
- **性能影响**: 无显著性能风险，本轮仅扩展字面量集合和页面展示
- **工具记录**:
  - `desktop-commander.read_file` 在本轮读取文本时仅返回元数据，无法获得正文
  - 补救措施：改用本地 `Get-Content -Raw -Encoding utf8` 读取文件内容
  - 结果：已完成证据收集，无需变更仓库代码或配置

### 8. 审查结论

- 已完成的 V1.5 能力：项目模板、项目全局搜索、路线筛选、自动保存、项目统计、问题节点明细
- 当前最明确的缺口：路线图要求的五态场景状态管理尚未补齐，代码与测试仅支持三态
- 本轮推进决策：补齐 `SceneStatus` 五态闭环，并同步测试、操作日志与验证报告
