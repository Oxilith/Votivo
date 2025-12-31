import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        setupFiles: ['./vitest.setup.ts'],
        include: ['src/**/*.test.ts', 'src/**/*.spec.ts', 'src/**/__tests__/**/*.ts'],
        exclude: ['node_modules', 'dist'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html', 'lcov'],
            reportsDirectory: './coverage',
            include: ['src/**/*.ts'],
            exclude: [
                'src/**/*.test.ts',
                'src/**/*.spec.ts',
                'src/**/__tests__/**',
                'src/types/**',
                // Entry points - integration, not unit testable
                'src/app.ts',
                'src/index.ts',
                // Routes - glue code, tested via controller tests
                'src/routes/**',
                // Rate-limit middleware - thin wrapper around express-rate-limit
                'src/middleware/rate-limiter.middleware.ts',
                // Barrel files - pure exports
                'src/**/index.ts',
            ],
            thresholds: {
                lines: 75,
                functions: 75,
                branches: 65,
                statements: 75,
            },
        },
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
});