import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{js,jsx,mjs}"],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
  },
  {
    files: ["src/lhs365/**/*.{js,jsx,mjs}", "src/main.jsx"],
    rules: {
      "no-unused-vars": ["error", { varsIgnorePattern: "^[A-Z]" }],
    },
  },
  {
    files: ["**/*.test.mjs"],
    languageOptions: { globals: globals.node },
  },
]);
