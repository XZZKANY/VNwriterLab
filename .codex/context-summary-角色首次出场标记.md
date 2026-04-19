## 项目上下文摘要（角色首次出场标记）

生成时间：2026-04-07 15:23:03

### 1. 相似实现分析

- **实现1**: `src/features/characters/pages/CharactersPage.tsx`
  - 模式：页面内纯函数派生角色关联数据，再用列表直接展示
  - 可复用：`getCharacterSceneReferences`、角色详情里的“被哪些场景引用”区块
  - 需注意：当前只统计场景数和引用次数，没有首次出场信息

- **实现2**: `src/features/characters/pages/CharactersPage.test.tsx`
  - 模式：通过预置 `project` 与 `editorScenes` 状态，直接验证角色页展示结果
  - 可复用：构造多个场景引用同一角色，再断言页面上的文本
  - 需注意：这是最适合先写失败测试的位置

- **实现3**: `src/features/graph/pages/GraphPage.tsx`
  - 模式：先做派生摘要，再在页面中渲染诊断列表
  - 可复用：展示“额外语义标签”时使用轻量文本追加，不引入复杂组件
  - 需注意：当前项目风格偏向最小只读摘要，而不是富交互标记系统

- **实现4**: `src/features/lore/pages/LorePage.tsx`
  - 模式：对场景关联结果进行纯函数解析，并用简单列表显示命中信息
  - 可复用：保留当前角色页“列表 + 简洁文案”的展示风格
  - 需注意：首次出场标记也应作为派生结果的一部分，而不是额外状态

### 2. 项目约定

- **命名约定**: 页面和组件使用 PascalCase，局部派生函数使用 camelCase，测试描述使用简体中文
- **文件组织**: 页面逻辑与页面测试共置；数据写入仍在 store，页面层做只读派生
- **代码风格**: 优先页面内纯函数派生，最小 JSX 变更，不引入新 hook、memo 或共享服务

### 3. 可复用组件清单

- `src/features/characters/pages/CharactersPage.tsx`
- `src/features/characters/pages/CharactersPage.test.tsx`
- `src/features/characters/store/useCharacterStore.ts`
- `src/features/projects/store/useProjectStore.ts`
- `src/features/editor/store/useEditorStore.ts`

### 4. 测试策略

- **测试框架**: Vitest + Testing Library + user-event
- **测试模式**: 页面渲染测试，直接构造多个引用场景并断言首次出场文案
- **参考文件**:
  - `src/features/characters/pages/CharactersPage.test.tsx`
  - `src/features/lore/pages/LorePage.test.tsx`
  - `src/features/graph/pages/GraphPage.test.tsx`
- **覆盖重点**:
  - 最早出场的场景条目出现“首次出场”标记
  - 其他引用场景不出现该标记
  - 现有路线关联和引用计数文案不被破坏

### 5. 依赖和集成点

- **内部依赖**: `currentProject.routes` 提供路线顺序，`editorScenes` 提供块级角色引用，`Character.routeId` 保持不变
- **集成方式**: 在角色页派生函数中补充首次出场标记字段，页面列表直接消费该字段
- **配置来源**: 现有项目创建与编辑器场景数据，无需新增持久化字段

### 6. 技术选型理由

- **为什么用这个方案**: 首次出场信息完全可以从现有场景和块引用推导出来，不需要修改角色模型
- **优势**: 改动面小、验证直接、与现有角色页结构完全一致
- **劣势和风险**: 若只按引用次数排序，会误判首次出场，因此必须额外引入按路线顺序和场景顺序的比较

### 7. 关键风险点

- **排序风险**: 当前场景引用列表默认按引用次数降序，首次出场判断不能直接依赖现有排序结果
- **边界条件**: 同一路线多个场景都引用角色；不同路线都有引用；场景 `sortOrder` 相同但 `id` 不同
- **范围风险**: 本轮只补“首次出场标记”，不扩展到“某场景涉及哪些角色”或复杂角色关系管理

### 8. 审查结论

- 角色与场景关联已有两项能力：路线关联、场景引用列表
- 代码搜索确认“首次出场标记”在仓库内完全缺失
- 本轮推进项确定为：在角色页引用列表中补齐首次出场标记，并保持现有页面结构不变
