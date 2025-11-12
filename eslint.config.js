import js from "@eslint/js";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import prettierPlugin from "eslint-plugin-prettier";
import playwrightPlugin from "eslint-plugin-playwright";

export default [
  js.configs.recommended,
  {
    files: ["**/*.ts"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
      },
      globals: {
        process: "readonly", // ✅ mark Node global
        Buffer: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
      },
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
      prettier: prettierPlugin,
      playwright: playwrightPlugin,
    },
    rules: {
      "no-unused-vars": "off", // prevent conflict with @typescript-eslint/no-unused-vars
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "prettier/prettier": "warn",
    },
  },
  {
    ignores: ["node_modules/**", "dist/**"],
  },
];
