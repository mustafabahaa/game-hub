import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import betterTailwindcss from "eslint-plugin-better-tailwindcss";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    extends: [betterTailwindcss.configs.recommended],
    settings: {
      "better-tailwindcss": {
        entryPoint: "src/app/globals.css",
        detectComponentClasses: true,
      },
    },
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "@typescript-eslint/no-deprecated": "error",
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "react-hooks/set-state-in-effect": "off",
      "better-tailwindcss/enforce-canonical-classes": "warn",
      "better-tailwindcss/no-unknown-classes": ["warn", {
        ignore: ["^animate-fadeIn$", "^animate-scaleIn$", "^custom-scrollbar$", "^split-parent$", "^dark$", "^font-outfit$"]
      }],
      "better-tailwindcss/enforce-consistent-class-order": "off",
      "better-tailwindcss/enforce-consistent-line-wrapping": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "tailwind.config.js",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
