// eslint.config.js - E2E workspace
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';

export default tseslint.config(
  eslint.configs.recommended,

  {
    ignores: ['dist/**', 'node_modules/**', 'playwright-report/**', 'test-results/**', '*.js', '*.mjs'],
  },

  // Page objects and fixtures - strict type-checked rules
  {
    files: ['pages/**/*.ts', 'fixtures/**/*.ts'],
    extends: [
      ...tseslint.configs.strictTypeChecked,
      ...tseslint.configs.stylisticTypeChecked,
    ],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.node,
      },
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-import-type-side-effects': 'error',
      '@typescript-eslint/restrict-template-expressions': [
        'error',
        { allowNumber: true, allowBoolean: true },
      ],
      // Allow empty object pattern for Playwright fixtures that don't need dependencies
      'no-empty-pattern': 'off',
    },
  },

  // Test files - Playwright test files
  {
    files: ['__tests__/**/*.spec.ts'],
    extends: [
      ...tseslint.configs.strict,
      ...tseslint.configs.stylistic,
    ],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.node,
      },
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      // Allow empty functions in tests (mock implementations)
      '@typescript-eslint/no-empty-function': 'off',
      // Allow floating promises for Playwright expect assertions
      '@typescript-eslint/no-floating-promises': 'off',
    },
  },

  // Playwright config file
  {
    files: ['playwright.config.ts'],
    extends: [
      ...tseslint.configs.strict,
      ...tseslint.configs.stylistic,
    ],
    languageOptions: {
      globals: {
        ...globals.node,
      },
      parserOptions: {
        projectService: {
          allowDefaultProject: ['playwright.config.ts'],
        },
        tsconfigRootDir: import.meta.dirname,
      },
    },
  }
);
