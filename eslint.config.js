import js from '@eslint/js';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import architectureRules from './eslint-rules/architecture.js';
import designSystemRules from './eslint-rules/design-system.js';

export default tseslint.config(
  { ignores: ['dist', 'node_modules'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
      globals: {
        document: 'readonly',
        window: 'readonly',
        navigator: 'readonly',
        localStorage: 'readonly',
        crypto: 'readonly',
        console: 'readonly',
        alert: 'readonly',
        confirm: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        Intl: 'readonly',
        React: 'readonly',
        HTMLElement: 'readonly',
        HTMLDivElement: 'readonly',
        MouseEvent: 'readonly',
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      'monochrome-architecture': { rules: architectureRules },
      'monochrome-design': { rules: designSystemRules },
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      '@typescript-eslint/no-unused-vars': ['error', { args: 'all', caughtErrors: 'all' }],
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-deprecated': 'error',
      'monochrome-architecture/no-infrastructure-imports-from-ui': 'error',
      'monochrome-architecture/feature-public-api': 'error',
      'monochrome-design/app-icon-only': 'error',
      'monochrome-design/no-direct-ui-imports': 'error',
      'monochrome-design/no-visual-sx': 'error',
      'monochrome-design/named-typography-variants': 'error',
    },
  },
);
