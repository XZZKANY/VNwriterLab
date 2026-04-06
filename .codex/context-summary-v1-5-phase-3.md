## 项目上下文摘要（V1.5 第三批）

生成时间：2026-04-06 02:10:11

### 1. 相似实现分析

- **实现1**: `src/features/editor/store/useEditorStore.ts`
  - 模式：变量、场景、块都由同一 store 原子更新并持久化
  - 可复用：`updateVariable`、`deleteScene`、`updateChoiceBlock`、`updateConditionBlock`
  - 需注意：变量和 block 元数据都在 editor store 内，删除变量应在这里完成

- **实现2**: `src/features/editor/components/ChoiceBlockEditor.tsx` 与 `ConditionBlockEditor.tsx`
  - 模式：受控表单，空值用 `null` / 空字符串兜底
  - 可复用：删除引用后的降级状态会自然显示为“请选择变量”或“不修改变量”
  - 需注意：删除引用后不需要新增复杂 UI，只要保持受控值合法

- **实现3**: `src/features/graph/lib/graphData.ts`
  - 模式：图页所有诊断都应在纯函数派生层完成
  - 可复用：已有问题节点筛选与条件摘要生成模式
  - 需注意：问题明细必须跟筛选结果一起收缩

### 2. 项目约定

- **命名约定**: store action 使用动词式 camelCase，组件 PascalCase，辅助函数保持语义化英文
- **文件组织**: feature 内聚，派生逻辑优先放 `lib`
- **代码风格**: store 负责修复写入，graph lib 负责只读诊断，页面只做最小渲染

### 3. 可复用组件清单

- `src/features/editor/store/useEditorStore.ts`
- `src/features/editor/store/choiceBlock.ts`
- `src/features/editor/store/conditionBlock.ts`
- `src/features/projects/store/useProjectStore.ts`
- `src/features/graph/lib/graphData.ts`

### 4. 测试策略

- **测试框架**: Vitest + Testing Library
- **测试模式**: 页面交互测试 + graph 纯函数测试 + 持久化恢复测试
- **参考文件**:
  - `src/features/editor/pages/EditorPage.test.tsx`
  - `src/features/graph/lib/graphData.test.ts`
  - `src/features/graph/pages/GraphPage.test.tsx`
  - `src/lib/store/persistence.test.ts`

### 5. 依赖和集成点

- **内部依赖**: editor store 保存变量与 block 元数据；project store 发起场景删除；graph lib 消费 editor store 派生诊断
- **集成方式**: 删除时主动修复，图页被动诊断

### 6. 技术选型理由

- **为什么用这个方案**: 最符合当前架构，改动面小且测试清晰
- **优势**: 新增脏数据会被阻止，历史脏数据也能被看见
- **劣势和风险**: 删除逻辑需要覆盖多个 block 元数据分支，稍不注意就会漏

### 7. 关键风险点

- **数据一致性**: 删除变量 / 场景后不能只清 links，不清 metaJson
- **边界条件**: 删除最后一个变量；删除被多个选项或条件引用的变量；历史脏数据重载后图页诊断
- **可维护性**: 问题规则如果散在页面里，后续会难以扩展
