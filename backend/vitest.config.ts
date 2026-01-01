/**
 * @file vitest.config.ts
 * @purpose Vitest test configuration for backend microservice
 * @functionality
 * - Configures test environment for Node.js
 * - Separates unit and integration tests using projects
 * - Sets up coverage reporting with thresholds
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
        lines: 85,
        functions: 85,
        branches: 80,
        statements: 85,
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
