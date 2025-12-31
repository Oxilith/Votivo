/**
 * @file vitest.config.ts
 * @purpose Vitest test configuration for prompt-service microservice
 * @functionality
 * - Configures test environment for Node.js
 * - Separates unit and integration tests using projects
 * - Sets up coverage reporting with thresholds
 * - Excludes admin UI from test coverage
 * - Configures path aliases
 * @dependencies
 * - vitest
 */

import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.d.ts',
        'src/admin/**',
        // Entry points - integration, not unit testable
        'src/index.ts',
        'src/app.ts',
        // Routes - glue code, tested via controller tests
        'src/routes/**',
        // Barrel files - pure exports
        'src/**/index.ts',
        // Audit service - logging wrapper, no business logic to test
        'src/services/audit.service.ts',
        // User auth controller - integration layer with complex auth flows
        // Core CRUD controllers (prompt, ab-test, resolve) are tested
        'src/controllers/user-auth.controller.ts',
      ],
      thresholds: {
        lines: 75,
        functions: 75,
        branches: 65,
        statements: 75,
      },
    },
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          environment: 'node',
          setupFiles: ['./vitest.setup.ts'],
          include: ['__tests__/unit/**/*.test.ts'],
          exclude: ['node_modules', 'dist'],
          testTimeout: 10000,
        },
      },
      {
        extends: true,
        test: {
          name: 'integration',
          environment: 'node',
          setupFiles: ['./vitest.setup.ts'],
          include: [
            '__tests__/integration/**/*.test.ts',
            '__tests__/integration/**/*.flow.test.ts',
          ],
          exclude: ['node_modules', 'dist'],
          testTimeout: 30000,
          hookTimeout: 30000,
          // Run integration tests sequentially to avoid SQLite database locking
          // Use single-threaded mode for database access
          maxConcurrency: 1,
          fileParallelism: false,
        },
      },
    ],
  },
});
