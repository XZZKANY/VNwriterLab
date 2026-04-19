## 项目上下文摘要（V1.5 store 边界收紧）

生成时间：2026-04-09 19:55:00

### 1. 相似实现分析
- **实现1**：`src/features/projects/store/useProjectStore.ts`
  - 模式：store 顶部已内嵌 `getSceneOrderComparator`、`normalizeScenesByRoute`、`swapScenePosition`、`moveSceneToRoute`、`syncEditorScenes` 等纯函数，再由 action 负责 `markDirty/markSaved`、`set` 与 `useEditorStore.setState`
  - 可复用：项目侧场景排序、跨路线移动、editor 场景镜像同步
  - 需注意：不能改变现有 action 的副作用顺序
- **实现2**：`src/features/editor/store/useEditorStore.ts`
  - 模式：文件尾部已存在 `normalizeSceneBlocks`、`sortScenesByRouteAndOrder`、`normalizeScenesByRoute` 等纯 helper，但仍与大 store 同文件耦合
  - 可复用：编辑器侧场景归一化与块排序逻辑
  - 需注意：删除场景时还会联动 choice/condition 元数据与 links
- **实现3**：`src/features/editor/store/linkUtils.ts`、`choiceBlock.ts`、`conditionBlock.ts`
  - 模式：把纯计算和元数据转换拆到独立模块，并用小而准的 Vitest 覆盖
  - 可复用：本轮 helper 下沉的文件组织方式与测试粒度

### 2. 项目约定
- store action 保持动词式 camelCase；纯逻辑优先拆到同 feature 下独立 helper 文件
- 页面/组件不承担复杂派生；store 负责编排与副作用，helper 负责纯计算
- 当前状态管理继续沿用 Zustand `create + persist`，不新增 repository/service 层

### 3. 可复用组件清单
- `src/features/editor/store/linkUtils.ts`
- `src/features/editor/store/choiceBlock.ts`
- `src/features/editor/store/conditionBlock.ts`
- `src/lib/store/persistence.test.ts`
- `src/features/editor/store/useEditorStore.test.ts`

### 4. 测试策略
- 新增 helper 级 Vitest：先让“模块不存在/导出缺失”形成 red，再实现 helper 形成 green
- 参考 `useEditorStore.test.ts` 与 `persistence.test.ts` 保持简体中文断言标题和本地状态驱动风格
- 收口验证顺序：helper 定向测试 → `npm.cmd test` → `npm.cmd run build`

### 5. 依赖和集成点
- `useProjectStore` 依赖 `useEditorStore` 做镜像场景同步
- `useEditorStore` 依赖 `choiceBlock.ts`、`conditionBlock.ts`、`linkUtils.ts` 清理引用与生成连接
- 外部文档：Context7 `/pmndrs/zustand` 指出 action 与 state 可继续 colocate，但复杂更新逻辑可放到外部模块级函数以改善代码拆分；当前更适合“保留 action、下沉纯 helper”

### 6. 本轮选择
- 先抽 `useProjectStore` 的项目场景 helper，再抽 `useEditorStore` 的编辑器场景 helper
- 目标不是改架构，而是把既有纯逻辑显式模块化并补齐测试护栏

### 7. 关键风险点
- 项目侧与编辑器侧对场景排序的规则不同，不能错误共用同一个归一化函数
- 删除/移动场景后若选中态或 blocks/links 清理顺序改变，可能引入隐性回归
- TDD 必须真实经历 red→green，不能直接搬代码后补测
