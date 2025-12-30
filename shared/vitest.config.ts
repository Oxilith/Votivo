/**
 * @file vitest.config.ts
 * @purpose Vitest test configuration for shared types and utilities package
 * @functionality
 * - Configures test environment for Node.js
 * - Sets up coverage reporting with thresholds
 * - Excludes testing utilities from coverage (they are infrastructure, not business logic)
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
    environment: 'node',
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
        'src/testing/**', // Testing utilities are infrastructure, not business logic
        'src/index.ts',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80,
      },
    },
  },
});
