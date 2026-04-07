# V1.5 结构治理增强：内容缺失规则设计

## 1. 目标

在现有分支图已经支持结构异常与问题分类展示的基础上，继续补齐更贴近创作质量的提醒。本轮只新增“内容缺失”这一条规则，用来识别“场景并非没有块，但仍然没有任何可读正文或选项文案”的情况。

本轮继续沿用 `graph` feature 的纯函数诊断模式，不新增 `repository/service` 层，不扩展自动修复，不调整编辑器存储结构。

## 2. 范围收敛

### 2.1 本轮纳入范围

- 新增问题分类：`内容缺失`
- 新增问题文案：用于提示场景没有任何有效正文或选项文案
- 保持分支图页现有问题明细展示方式不变，直接消费新分类和新问题
- 补齐纯函数测试与页面展示测试

### 2.2 本轮明确不做

- 不新增“摘要缺失”“占位标题”“分支过薄”等其他创作质量规则
- 不新增问题优先级、严重程度、颜色标签或单独筛选器
- 不修改编辑器 UI，不在场景编辑页做实时拦截或强提醒
- 不实现自动修复建议

## 3. 当前现状

当前 `src/features/graph/lib/graphData.ts` 已经是问题规则的唯一来源，能够输出：

- `空场景`
- `无入边`
- `无出口`
- `条件异常`
- `跳转异常`
- `副作用异常`

`src/features/graph/pages/GraphPage.tsx` 已经会直接展示 `issueSummaries.categories` 与 `issueSummaries.issues`，因此新增规则不需要先改页面结构，只需要让纯函数继续产出兼容的数据即可。

## 4. 方案比较

### 方案 A：直接在 `graphData.ts` 继续扩规则【推荐】

做法：

- 在现有 `collectSceneIssues` 流程中新增“内容缺失”判定
- 继续由 `issueSummaries` 输出分类与文案
- 页面无需新增协议，只复用现有展示

优点：

- 与当前仓库结构完全一致
- 改动面最小
- 最适合通过纯函数测试先锁定行为

缺点：

- 规则会继续累积在 `graphData.ts` 中

### 方案 B：先抽独立的场景内容诊断辅助模块

做法：

- 新建单独纯函数文件负责判定“是否有有效内容”
- `graphData.ts` 只消费诊断结果

优点：

- 未来继续扩创作质量规则时职责更清楚

缺点：

- 对当前只新增一条规则而言，抽象成本偏高
- 会把本轮从“补规则”扩大成“规则 + 结构整理”

### 方案 C：规则与 UI 一起升级

做法：

- 除了新增 `内容缺失` 规则，再同步补问题排序或更明显的标签展示

优点：

- 用户感知更强

缺点：

- 超出当前范围
- 会把本轮从纯规则增强变成混合改动

结论：

采用方案 A。先把“内容缺失”规则稳定落到 `graphData.ts`，继续复用现有 `GraphPage` 展示协议。

## 5. 规则定义

### 5.1 空场景与内容缺失的边界

- `blocks.length === 0`：继续归类为 `空场景`
  - 文案保持：`当前场景还没有任何内容块`
- `blocks.length > 0` 且没有任何有效内容：归类为 `内容缺失`
  - 新文案：`当前场景还没有任何有效正文或选项文案`

两者必须并存但不能混淆。第一种表示场景完全没有块，第二种表示场景存在块但仍然没有任何可读推进内容。

### 5.2 严格版有效内容判定

以下情况视为“有有效内容”：

- `dialogue` 块的 `contentText.trim()` 非空
- `narration` 块的 `contentText.trim()` 非空
- `choice` 块的 `parseChoiceBlockMeta(metaJson).label.trim()` 非空

以下情况不视为“有有效内容”：

- `note`
- `condition`
- `dialogue` / `narration` 的文本仅包含空白字符
- `choice` 的 `label` 为空或仅包含空白字符

该判定必须明确体现一个事实：`choice` 的可读内容来源是 `metaJson.label`，不是 `contentText`。

### 5.3 首批命中样例

以下场景应命中 `内容缺失`：

- 只有 `note`
- 只有 `condition`
- 只有空白 `narration`
- 只有空白 `dialogue`
- 只有 `label` 为空白的 `choice`
- 混合存在多个块，但所有可读文本位都为空白

以下场景不应命中 `内容缺失`：

- 至少存在一个非空 `narration`
- 至少存在一个非空 `dialogue`
- 至少存在一个 `label` 非空的 `choice`

## 6. 关键文件

- `src/features/graph/lib/graphData.ts`
- `src/features/graph/lib/graphIssueCategories.test.ts`
- `src/features/graph/pages/GraphPage.issueCategories.test.tsx`
- `src/lib/domain/block.ts`（只读参考，不计划修改）
- `src/features/editor/store/choiceBlock.ts`（只读参考，用于确认 `choice.label` 解析方式）

## 7. 测试策略

### 7.1 纯函数测试

在 `graphIssueCategories.test.ts` 中补至少两组测试：

- 有块但没有任何有效内容时，输出 `内容缺失`
- 只要存在一个有效正文或选项文案时，不输出 `内容缺失`

纯函数测试应优先覆盖：

- 只有空白 narration / dialogue
- 只有空白 choice label
- 只有 note / condition
- 空场景与内容缺失的边界不串线

### 7.2 页面展示测试

在 `GraphPage.issueCategories.test.tsx` 中验证：

- 问题明细区域会显示 `问题分类：内容缺失`
- 对应文案会显示 `当前场景还没有任何有效正文或选项文案`
- 现有 `空场景` 展示不被破坏

### 7.3 收口验证

本轮实现完成后至少执行：

- `npm.cmd test -- src/features/graph/lib/graphIssueCategories.test.ts src/features/graph/pages/GraphPage.issueCategories.test.tsx src/features/graph/pages/GraphPage.test.tsx`
- `npm.cmd test`
- `npm.cmd run build`

## 8. 风险与控制

- 如果把 `note` 算作有效内容，会让“只有注释没有正文”的场景误判为健康，因此本轮明确排除 `note`
- 如果继续只看 `contentText`，会漏掉 `choice.label`，因此必须显式解析 choice 元数据
- 如果把 `blocks.length > 0` 的场景一律视为非空，会让“只有结构块或空白块”的创作半成品漏检，因此必须引入严格版判定

## 9. 验收结论

当以下条件同时满足时，本设计视为完成：

- `graphData.ts` 能稳定产出 `内容缺失` 分类
- `GraphPage` 在不改协议的前提下直接展示新分类与新文案
- 纯函数测试、页面测试、全量测试和构建验证均通过
- `空场景` 与 `内容缺失` 的边界在测试中得到明确锁定
