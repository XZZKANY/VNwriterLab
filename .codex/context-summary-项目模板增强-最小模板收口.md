## 项目上下文摘要（项目模板增强-最小模板收口）

生成时间：2026-04-18

### 1. 相似实现分析

- **实现1**: `src/features/projects/components/ProjectCreateForm.tsx`
  - 模式：受控 `<select>` 直接绑定 `ProjectTemplate`
  - 可复用：表单只需收口可选项，保持 `onSubmit(name, summary, template)` 不变
  - 需注意：页面层不承载模板初始化逻辑

- **实现2**: `src/lib/domain/project.ts`
  - 模式：项目模板结构集中在 `createEmptyProject` / `createTemplateProject`
  - 可复用：`createTemplateScene`、`projectType`、`Route.routeType`、起始场景与结局场景语义
  - 需注意：模板逻辑必须继续收敛在领域层

- **实现3**: `src/lib/domain/domain.test.ts`
  - 模式：直接断言模板生成后的 `projectType`、路线、场景标题和起始/结局语义
  - 可复用：新增模板收口时优先在这里写结构断言
  - 需注意：这层最适合验证模板是否被真正收口

- **实现4**: `src/features/projects/pages/ProjectHomePage.test.tsx`
  - 模式：页面测试通过真实表单交互创建项目，再断言首页结构
  - 可复用：`user.selectOptions + 创建项目` 的闭环验证
  - 需注意：页面测试要证明模板入口真实可用

### 2. 项目约定

- **命名约定**: 模板值使用英文字面量，组件使用 PascalCase，纯函数使用 camelCase
- **文件组织**: 表单入口位于 `features/projects/components`，模板工厂位于 `src/lib/domain`，页面验证位于 `features/projects/pages`
- **代码风格**: 领域层集中生成结构，页面层只做受控输入和最小展示，不新增服务层或注册表

### 3. 可复用组件清单

- `src/features/projects/components/ProjectCreateForm.tsx`
- `src/lib/domain/project.ts`
- `src/lib/domain/domain.test.ts`
- `src/features/projects/pages/ProjectHomePage.test.tsx`
- `src/features/projects/store/useProjectStore.ts`

### 4. 测试策略

- **测试框架**: Vitest + Testing Library
- **测试模式**:
  - 领域层：验证三种模板的结构输出
  - 页面层：验证模板选择与创建闭环
- **覆盖重点**:
  - 模板是否只保留线性短篇、多结局、共通线 + 角色线
  - 初始化结构是否与路线图一致
  - 首页创建流程是否能正确展示结构

### 5. 依赖和集成点

- **内部依赖**: `ProjectCreateForm` 依赖 `ProjectTemplate`；`useProjectStore.createProject` 依赖 `createEmptyProject`；首页展示依赖项目 routes/scenes
- **集成方式**: 扩展模板联合类型后，表单和领域工厂共享同一模板值集合，store 无需改造
- **配置来源**: `package.json` 已定义 `test` 与 `build` 脚本，可直接复用

### 6. 关键风险点

- **一致性风险**: `ProjectTemplate`、表单选项、领域工厂与测试必须同步收口
- **范围风险**: 只做三种模板，不顺手重构模板系统
- **验证风险**: 需要同时验证领域输出和页面入口，避免只实现其一