## 项目上下文摘要（结构治理增强：空场景提醒 + 问题分类）

生成时间：2026-04-18 12:14:10

### 1. 相似实现分析

- **实现1**：`src/features/graph/lib/graphData.ts`
  - 模式：纯函数派生图数据，问题收集与条件摘要分离
  - 可复用：`buildSceneGraph`、`applySceneGraphFilters`
  - 需注意：问题分类直接由 `issue.category` 驱动，渲染层只做展示
- **实现2**：`src/features/graph/pages/GraphPage.tsx`
  - 模式：页面层直接消费图数据并渲染“问题明细”区域
  - 可复用：现有 `graph.issueSummaries` 与分类展示逻辑
  - 需注意：页面层不应再重复计算问题分类
- **实现3**：`src/features/graph/pages/GraphPage.issueCategories.test.tsx`
  - 模式：页面级测试验证分类文案与问题描述并存
  - 可复用：问题分类、空场景提醒的断言方式
  - 需注意：测试应聚焦用户可见文本，不依赖内部实现细节

### 2. 项目约定

- **命名约定**：TypeScript 使用 camelCase；测试描述采用中文句式
- **文件组织**：图数据纯函数放在 `lib/`，页面渲染放在 `pages/`
- **导入顺序**：先外部库，再项目内模块；类型与运行时代码分层清晰
- **代码风格**：小函数拆分、纯函数优先、表驱动测试风格较明显

### 3. 可复用组件清单

- `buildSceneGraph`：图节点、边、条件摘要、问题摘要统一派生
- `applySceneGraphFilters`：路线筛选与“只看问题节点”收缩
- `GraphPage`：问题明细区域的展示入口

### 4. 测试策略

- **测试框架**：Vitest + Testing Library
- **测试模式**：纯函数单测 + 页面级渲染测试
- **参考文件**：`src/features/graph/lib/graphIssueCategories.test.ts`、`src/features/graph/pages/GraphPage.test.tsx`
- **覆盖要求**：空场景、内容缺失、分类显示、过滤后仍保留问题节点

### 5. 依赖和集成点

- **外部依赖**：React Flow、Vitest、Testing Library
- **内部依赖**：场景/连线/变量领域类型与 editor store 的数据
- **集成方式**：页面层读取 store，传入 `buildSceneGraph` 后再经 `applySceneGraphFilters`
- **配置来源**：路线筛选状态由页面本地 state 控制

### 6. 技术选型理由

- **为什么用这个方案**：问题分类属于派生数据，放在纯函数层最容易测试和复用
- **优势**：页面无需再做分类逻辑，降低耦合
- **劣势和风险**：分类文案变更会影响多个断言，需要同步更新测试

### 7. 关键风险点

- **边界条件**：空场景与内容缺失需互斥，避免双重误报
- **一致性**：分类顺序依赖问题收集顺序，修改时需保持测试一致
- **性能瓶颈**：当前实现以小规模场景为主，问题收集为线性扫描，成本可接受
- **安全考虑**：本任务仅涉及展示与派生逻辑，无新增安全面
