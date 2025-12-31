// eslint.config.js
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import vitest from '@vitest/eslint-plugin';
import globals from 'globals';

export default tseslint.config(
    eslint.configs.recommended,

    {
        ignores: ['dist/**', 'node_modules/**', '*.js', '*.mjs', 'coverage/**'],
    },

    // Production code - strict type-checked rules
    {
        files: ['src/**/*.ts'],
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
            '@typescript-eslint/restrict-template-expressions': 'off',
        },
    },

    // Test files - strict rules without type-checking (vitest globals cause type issues)
    {

        files: ['__tests__/**/*.test.ts', '__tests__/**/*.spec.ts', '__tests__/**/*.ts'],
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
                ...globals.node,
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
        },
    },

    // Vitest config file
    {
        files: ['vitest.config.ts'],
        extends: [
            ...tseslint.configs.strict,
            ...tseslint.configs.stylistic,
        ],
        plugins: {
            vitest,
        },
        languageOptions: {
            globals: {
                ...globals.node,
                ...vitest.environments.env.globals,
            },
            parserOptions: {
                projectService: {
                    allowDefaultProject: ['vitest.config.ts'],
                },
                tsconfigRootDir: import.meta.dirname,
            },
        },
        rules: {
            ...vitest.configs.recommended.rules,
        },
    }
);
