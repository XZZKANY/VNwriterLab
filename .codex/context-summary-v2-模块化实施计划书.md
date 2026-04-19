## 项目上下文摘要（V2模块化实施计划书）

生成时间：2026-04-19 19:20:00

### 1. 相似实现分析

- **实现1**：`docs/superpowers/plans/2026-04-06-v1-5-current-roadmap.md`
  - 模式：先给当前基线，再列缺口、执行顺序、验证策略、风险
  - 可复用：`Goal/Architecture/Tech Stack` 三段式抬头 + 风险与验证结构
  - 需注意：文档必须和“当前已收口状态”同步，避免计划落后代码

- **实现2**：`docs/superpowers/plans/2026-04-11-v2-editor-scenes-repository-drive.md`
  - 模式：按步骤拆分任务，明确文件改动点与定向测试
  - 可复用：`步骤 -> 文件 -> 验证 -> 留痕` 的执行结构
  - 需注意：每一步都要给出可本地重复的验证命令

- **实现3**：`docs/superpowers/plans/2026-04-11-v2-scene-lifecycle-links-boundary.md`
  - 模式：按子阶段（6A/6B）拆分，强调依赖顺序与接口边界
  - 可复用：模块内“任务粒度 + 依赖顺序 + 回归验证”写法
  - 需注意：先稳定生命周期与边界，再扩展能力，避免状态分叉

- **实现4**：`开发路线图（V1  V1.5  V2）.md`
  - 模式：从产品目标定义功能范围与最终边界
  - 可复用：V2 目标四件套（伏笔追踪、高级条件、多视图、导出能力）
  - 需注意：坚持“结构化写作闭环”主线，避免需求失焦

### 2. 项目约定

- **命名约定**：计划文档标题统一“阶段/Step + 能力名 + 实施计划”
- **文件组织**：路线文档放 `docs/superpowers/plans/`，任务留痕放 `.codex/`
- **验证口径**：定向测试 + `npm.cmd test` + `npm.cmd run build`
- **架构边界**：沿用 `feature` 内聚 + Zustand `persist` + graph/preview 派生，不新增额外服务层

### 3. 可复用组件清单（规划层）

- `docs/superpowers/plans/2026-04-06-v1-5-current-roadmap.md`：现状基线和风险写法
- `docs/superpowers/plans/2026-04-11-v2-editor-scenes-repository-drive.md`：步骤化实施模板
- `docs/superpowers/plans/2026-04-11-v2-scene-lifecycle-links-boundary.md`：依赖顺序与边界模板
- `开发路线图（V1  V1.5  V2）.md`：目标能力范围

### 4. 测试策略

- 计划书本身的“验证”采用文档核对 + 本地命令执行门禁
- 模块实施后统一要求：
  - 先定向测试
  - 再全量 `npm.cmd test`
  - 最后 `npm.cmd run build`

### 5. 依赖和集成点

- 业务集成点：`editor`、`graph`、`preview`、`projects`
- 领域集成点：`src/lib/domain` 与现有持久化/仓储适配层
- 验证集成点：Vitest + Testing Library + build pipeline

### 6. 关键风险点

- 条件系统语义扩展后编辑器和预览可能不一致
- 多视图并发演进易出现“多数据源”分叉
- 导出格式扩展易与现有数据模型脱节

### 7. 充分性检查

- 我能给出至少3个相似实现路径：是（以上4个）
- 我理解当前实现模式：是（基线+步骤+验证+留痕）
- 我知道可复用文档结构：是（三段式抬头、任务分解、验证命令）
- 我知道如何验证：是（定向+全量+build）
- 我确认不重复造轮子：是（沿用既有计划模板，不新造流程）
