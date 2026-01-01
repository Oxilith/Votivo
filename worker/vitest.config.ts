/**
 * @file vitest.config.ts
 * @purpose Vitest test configuration for worker microservice
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
        'src/index.ts',
        'src/prisma/client.ts',
        'src/utils/logger.ts',
        'src/jobs/index.ts',
      ],
      thresholds: {
        lines: 85,
        functions: 85,
        branches: 85,
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
        },
      },
    ],
  },
});
