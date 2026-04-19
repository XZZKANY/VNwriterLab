## 项目上下文摘要（项目模板增强补齐）

生成时间：2026-04-07 15:05:41

### 1. 相似实现分析

- **实现1**: `src/features/projects/components/ProjectCreateForm.tsx`
  - 模式：模板选择是一个受控 `<select>`，值直接绑定 `ProjectTemplate`
  - 可复用：新增模板时只需扩展联合类型并追加 `<option>`
  - 需注意：页面层不持有模板结构定义，只负责暴露入口

- **实现2**: `src/lib/domain/project.ts`
  - 模式：所有非空白模板都在 `createTemplateProject` 中集中创建
  - 可复用：`createTemplateScene`、`projectType`、`Route.routeType`、默认场景命名与排序约定
  - 需注意：模板创建逻辑应继续收敛在 domain 层，不能散到 store 或页面

- **实现3**: `src/lib/domain/domain.test.ts`
  - 模式：领域测试直接断言模板生成后的 `projectType`、路线列表、场景标题和起始/结局语义
  - 可复用：新增模板时沿用同样的结构断言方式
  - 需注意：这里是最适合先写失败测试的位置

- **实现4**: `src/features/projects/pages/ProjectHomePage.test.tsx`
  - 模式：页面测试通过真实表单交互选择模板，再验证项目首页是否展示对应结构
  - 可复用：新增模板后继续用 `user.selectOptions + 创建项目` 的方式验证入口闭环
  - 需注意：页面测试要证明表单确实暴露了新模板，而不仅是 domain 工厂支持

### 2. 项目约定

- **命名约定**: 模板值使用英文 snake-like 字面量，组件使用 PascalCase，纯函数使用 camelCase
- **文件组织**: 表单入口位于 `features/projects/components`，模板工厂位于 `src/lib/domain`，页面验证位于 `features/projects/pages`
- **代码风格**: 领域层统一生成结构，页面层只做受控输入和最小展示，不新增服务层或注册表

### 3. 可复用组件清单

- `src/features/projects/components/ProjectCreateForm.tsx`
- `src/lib/domain/project.ts`
- `src/lib/domain/domain.test.ts`
- `src/features/projects/pages/ProjectHomePage.test.tsx`
- `src/features/projects/store/useProjectStore.ts`

### 4. 测试策略

- **测试框架**: Vitest + Testing Library
- **测试模式**:
  - 领域层：验证模板工厂输出结构
  - 页面层：验证真实创建流程
- **参考文件**:
  - `src/lib/domain/domain.test.ts`
  - `src/features/projects/pages/ProjectHomePage.test.tsx`
- **覆盖重点**:
  - 新模板是否被表单暴露
  - 新模板是否生成明确的路线与场景骨架
  - 首页创建流程是否能正确展示结构

### 5. 依赖和集成点

- **内部依赖**: `ProjectCreateForm` 依赖 `ProjectTemplate`；`useProjectStore.createProject` 依赖 `createEmptyProject`；首页展示依赖项目 routes/scenes
- **集成方式**: 扩展模板联合类型后，表单和领域工厂共享同一模板值集合，store 无需修改
- **配置来源**: `package.json` 已定义 `test` 与 `build` 脚本，现有验证流程可直接复用

### 6. 技术选型理由

- **为什么用这个方案**: 模板增强是路线图明确承诺但当前只落了 3 种非空白模板，且现有代码已经具备稳定模板入口与测试模式
- **优势**: 改动边界非常集中，易于 TDD，且不会影响 editor/graph/preview 等其他模块
- **劣势和风险**: 新模板内容如果定义过于复杂，会偏离当前“最小骨架模板”风格；如果定义过于空，也会失去模板增强价值

### 7. 关键风险点

- **一致性风险**: `ProjectTemplate`、表单 `<option>`、domain 工厂和测试必须同步
- **范围风险**: 只能补齐两种模板，不应顺手重构模板系统
- **验证风险**: 必须同时验证领域输出和页面入口，避免只实现其一

### 8. 审查结论

- 路线图要求的模板增强共有 5 种：线性短篇、多结局、共通线 + 角色线、悬疑调查、恋爱路线
- 当前代码已实现的非空白模板只有 3 种：`linear_short`、`multi_ending`、`route_character`
- 本轮推进项是补齐缺失的 `悬疑调查模板` 和 `恋爱路线模板`
