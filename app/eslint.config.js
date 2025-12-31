// eslint.config.js
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import vitest from '@vitest/eslint-plugin';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';

export default tseslint.config(
    eslint.configs.recommended,

    {
        ignores: ['dist/**', 'node_modules/**', '*.js', '*.mjs', 'coverage/**', 'vitest.config.ts', 'vite.config.ts'],
    },

    // Production code - strict type-checked rules with React
    {
        files: ['src/**/*.{ts,tsx}'],
        ignores: ['src/test/**'],
        extends: [
            ...tseslint.configs.strictTypeChecked,
            ...tseslint.configs.stylisticTypeChecked,
        ],
        plugins: {
            'react-hooks': reactHooks,
            'react-refresh': reactRefresh,
        },
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'module',
            globals: {
                ...globals.browser,
            },
            parserOptions: {
                projectService: true,
                tsconfigRootDir: import.meta.dirname,
            },
        },
        rules: {
            ...reactHooks.configs.recommended.rules,
            'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
            '@typescript-eslint/no-unused-vars': [
                'error',
                { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
            ],
            '@typescript-eslint/consistent-type-imports': 'error',
            '@typescript-eslint/no-import-type-side-effects': 'error',
        },
    },

    // Test files - strict rules without type-checking (vitest globals cause type issues)
    {
        files: ['__tests__/**/*.{ts,tsx}', 'src/test/**/*.{ts,tsx}'],
        extends: [
            ...tseslint.configs.strict,
            ...tseslint.configs.stylistic,
        ],
        plugins: {
            vitest,
        },
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'module',
            globals: {
                ...globals.browser,
                ...vitest.environments.env.globals,
            },
            parserOptions: {
                projectService: true,
                tsconfigRootDir: import.meta.dirname,
            },
        },
        rules: {
            ...vitest.configs.recommended.rules,
            '@typescript-eslint/no-unused-vars': [
                'error',
                { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
            ],
            // Allow empty functions in tests (mock implementations)
            '@typescript-eslint/no-empty-function': 'off',
            'react-refresh/only-export-components': 'off',
        },
    }
);
