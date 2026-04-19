# Vitest 排除 worktree 污染设计

## 目标

修复 `vitest` 在根工作区执行时扫描 `.worktrees` 的问题，确保 `npm.cmd test` 只反映主工作区真实测试结果。

## 本轮范围

- 修改 `vitest.config.ts`
- 追加 `.worktrees` 排除规则
- 重新运行主工作区测试
- 输出真实测试结论

## 不在本轮范围

- `useProjectStore` / `useEditorStore` 拆分
- `EditorPage.test.tsx` 的 `act(...)` 警告修复
- localStorage 到 SQLite 的收敛改造

## 设计决策

采用 Vitest 官方推荐写法：基于 `configDefaults.exclude` 追加 `**/.worktrees/**`，避免手写 `exclude` 时覆盖默认排除项。

## 验证策略

由于这是配置文件改动，采用命令级 red/green：

- **Red**：当前 `npm.cmd test` 输出包含 `.worktrees/v1-5-content-gap-rule/...`
- **Green**：修改配置后 fresh run `npm.cmd test`，输出中不再出现 `.worktrees` 路径

## 风险与控制

- 风险：自定义 `exclude` 覆盖 Vitest 默认值
- 控制：必须从 `configDefaults.exclude` 扩展

- 风险：把验证环境修复与架构改造混在一起
- 控制：本轮只做最小配置修复

## 备注

当前工作区已有未提交改动，为避免混入无关内容，本轮不执行 git commit。
