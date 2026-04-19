## 项目上下文摘要（V1 分支图增强）

生成时间：2026-04-06  

### 1. 相似实现分析

- **实现1**: `src/features/graph/lib/graphData.ts`
  - 模式：纯函数把领域数据转换为图渲染数据
  - 可复用：场景排序逻辑、ReactFlow `Node` / `Edge` 输出结构
  - 需注意：当前仅输出标题与连线标签，没有条件摘要字段
- **实现2**: `src/features/editor/store/conditionBlock.ts`
  - 模式：条件块元数据的解析与序列化
  - 可复用：`parseConditionBlockMeta`、`stringifyConditionBlockMeta`
  - 需注意：摘要需要结合变量名才能可读
- **实现3**: `src/features/preview/lib/previewEngine.ts`
  - 模式：按块类型和条件元数据做运行时推导
  - 可复用：条件块与变量信息的匹配思路
  - 需注意：预览侧已证明条件元数据是稳定数据源

### 2. 项目约定

- **命名约定**: 组件与工具使用 PascalCase / camelCase，测试文件使用 `.test.tsx` / `.test.ts`
- **文件组织**: feature 内按 `pages`、`components`、`lib`、`store` 分层
- **导入顺序**: 先外部依赖，再内部模块；同层级模块按功能分组
- **代码风格**: TypeScript 严格模式，函数式组件和纯函数优先，样式多为内联小布局

### 3. 可复用组件清单

- `src/features/editor/store/conditionBlock.ts`: 条件元数据解析与序列化
- `src/features/editor/store/useEditorStore.ts`: 场景、连线、变量状态与场景选择
- `src/features/preview/lib/previewEngine.ts`: 条件与变量组合推导模式
- `src/features/graph/lib/graphData.ts`: 图谱数据组装入口

### 4. 测试策略

- **测试框架**: Vitest + Testing Library
- **测试模式**: 组件渲染测试、store 行为测试、纯函数测试
- **参考文件**: `src/features/graph/pages/GraphPage.test.tsx`、`src/features/graph/lib/graphData.test.ts`、`src/features/editor/store/useEditorStore.test.ts`
- **覆盖要求**: 条件摘要生成、图页展示、图页返回编辑入口

### 5. 依赖和集成点

- **外部依赖**: React、react-router-dom、reactflow、zustand
- **内部依赖**: `useEditorStore` 提供 scenes / links / variables / selectedSceneId
- **集成方式**: GraphPage 直接读取 store，并通过路由跳转回编辑页
- **配置来源**: `src/main.tsx` 路由定义，`AppShell` 提供主导航壳

### 6. 技术选型理由

- **为什么用这个方案**: 最小改动即可形成闭环，不需要新增复杂的图编辑或定位系统
- **优势**: 复用现有条件块数据，编辑入口不引入额外状态管理
- **劣势和风险**: 条件摘要是推导文本，遇到变量缺失时只能做降级展示

### 7. 关键风险点

- **并发问题**: 当前无额外并发风险，主要是状态切换与导航顺序
- **边界条件**: 条件块缺少变量、变量被删除、一个场景存在多个条件块
- **性能瓶颈**: 仅在页面渲染时做线性扫描，规模很小
- **安全考虑**: 本任务不涉及新增安全控制逻辑
