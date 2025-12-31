/**
 * @file vitest.config.ts
 * @purpose Vitest test configuration for worker microservice
 * @functionality
 * - Configures test environment for Node.js
 * - Sets up coverage reporting with thresholds
 * - Configures path aliases
 * @dependencies
 * - vitest
 */

import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.{test,spec}.ts'],
    exclude: ['node_modules', 'dist'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.d.ts',
        'src/**/*.test.ts',
        'src/**/*.spec.ts',
        'src/index.ts',
        'src/prisma/client.ts',
        'src/utils/logger.ts',
        'src/jobs/index.ts',
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
