import js from "@eslint/js";
import prettierConfig from "eslint-config-prettier";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "dist/**",
      "node_modules/**",
      "src-tauri/**",
      ".worktrees/**",
      ".claude/**",
      "build/**",
      "scripts/**",
      "*.config.ts",
      "*.config.js",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      react,
      "react-hooks": reactHooks,
    },
    rules: {
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      // React 19 / 新版 JSX runtime 不再需要 `import React`
      "react/react-in-jsx-scope": "off",
      // 我们用 TypeScript 代替 prop-types
      "react/prop-types": "off",
      // tsconfig 已经开启 noUnusedLocals/noUnusedParameters，与 TS 一致
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
    },
    settings: {
      react: { version: "detect" },
    },
  },
  // 测试文件：放宽一些规则
  {
    files: ["**/*.test.{ts,tsx}", "**/setupTests.ts", "src/test/**"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
  // 必须最后：关闭与 Prettier 冲突的所有格式相关规则，让 Prettier 单独负责格式
  prettierConfig,
);
