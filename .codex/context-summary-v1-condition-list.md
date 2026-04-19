## 项目上下文摘要（V1.5 条件系统升级到条件列表）

生成时间：2026-04-06 00:00:00

### 1. 相似实现分析

- **实现 1**: `src/features/editor/store/choiceBlock.ts`
  - 模式：轻量 `metaJson` 解析 / 序列化。
  - 可复用：`parseChoiceBlockMeta` / `stringifyChoiceBlockMeta` 的兜底写法。
  - 需注意：当前条件元数据应沿用同类结构，兼容空值与旧格式。
- **实现 2**: `src/features/editor/components/ChoiceBlockEditor.tsx`
  - 模式：受控表单组件，输入变化立即回调 store。
  - 可复用：字段受控、`onChange` 只负责上抛数据，不直接改 store。
  - 需注意：条件编辑器应保持同样的受控边界，避免把业务逻辑塞进组件。
- **实现 3**: `src/features/preview/lib/previewEngine.ts`
  - 模式：纯函数求值，按块类型顺序扫描场景块。
  - 可复用：条件判断下沉到纯函数，页面只消费结果。
  - 需注意：AND 语义应在纯函数层实现，不能散落到页面或 store。
- **实现 4**: `src/lib/store/persistence.test.ts`
  - 模式：通过 store 直接操作并验证持久化回读。
  - 可复用：新增存储格式时，优先补回读兼容测试。
  - 需注意：旧单条件数据要保留兜底解析，不要破坏现有持久化数据。

### 2. 项目约定

- **命名约定**：标识符使用英文 `camelCase` / `PascalCase`，测试与文档说明使用简体中文。
- **文件组织**：领域类型放在 `src/lib/domain`，feature 内的 `store` / `components` / `lib` 彼此内聚。
- **导入顺序**：第三方依赖在前，本地模块在后，保持既有相对路径风格。
- **代码风格**：偏小函数、受控组件、纯函数求值，避免新增多余抽象层。

### 3. 可复用组件清单

- `src/features/editor/store/useEditorStore.ts`：条件块创建与更新入口。
- `src/features/editor/store/choiceBlock.ts`：meta 解析 / 序列化模式参考。
- `src/features/editor/components/ConditionBlockEditor.tsx`：条件编辑器 UI 位置。
- `src/features/editor/components/SceneBlockList.tsx`：条件编辑器挂载点。
- `src/features/preview/lib/previewEngine.ts`：条件求值与可见块解析入口。
- `src/features/preview/pages/PreviewPage.test.tsx`：预览页面定向测试入口。
- `src/features/editor/pages/EditorPage.test.tsx`：编辑器定向测试入口。

### 4. 测试策略

- **测试框架**：Vitest + Testing Library。
- **测试模式**：以页面集成测试和纯函数测试为主，必要时补 store 持久化回读测试。
- **参考文件**：`src/features/preview/pages/PreviewPage.test.tsx`、`src/features/editor/pages/EditorPage.test.tsx`、`src/lib/store/persistence.test.ts`。
- **覆盖要求**：旧单条件兼容、多个条件 AND 全通过、任一条件不满足即失败、编辑器能更新列表项。

### 5. 依赖和集成点

- **外部依赖**：`react`、`zustand`、`vitest`、`@testing-library/react`。
- **内部依赖**：`useEditorStore` 产出场景与变量，`previewEngine` 消费块与变量。
- **集成方式**：条件元数据通过 `metaJson` 存储，编辑器受控回调写回 store，预览层纯函数读取并求值。
- **配置来源**：`package.json` 的 `test` / `build` 脚本，`tsconfig.json` 的 TypeScript 约束。

### 6. 技术选型理由

- **为什么用这个方案**：仓库已经稳定采用单 store + 受控编辑 + 纯函数预览，最小改动能把风险限制在协议层。
- **优势**：改动面集中、可测试、兼容旧数据更容易控制。
- **劣势和风险**：只支持 AND 列表时，未来若扩展 OR / 分组，需要再拆一次条件协议。

### 7. 关键风险点

- **数据兼容**：旧单条件 `metaJson` 可能缺少新字段，需要在解析时兜底。
- **边界条件**：空条件列表、缺失变量、无效条件项都要明确返回失败或安全默认值。
- **性能瓶颈**：当前是线性扫描，条件列表增加后仍可接受，不需要提前优化。
- **安全考虑**：本次不引入新安全边界，只处理数据结构与求值逻辑。
