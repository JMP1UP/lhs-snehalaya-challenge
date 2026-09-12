import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
  // The original Steps application is retained as an historical reference;
  // src/main.jsx mounts the maintained LHS 365 application instead.
  globalIgnores(["dist", "src/App.jsx"]),
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
    files: ["**/*.test.mjs", "api/**/*.mjs", "server/**/*.mjs"],
    languageOptions: { globals: globals.node },
  },
]);
