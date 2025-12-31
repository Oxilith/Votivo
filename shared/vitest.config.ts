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
        'src/**/*.types.ts', // Type definitions only, no executable code
        'src/testing/**', // Testing utilities are infrastructure, not business logic
        'src/validators/**', // Zod schema definitions are declarative, not business logic
        'src/tracing.ts', // W3C tracing utilities (infrastructure)
        'src/index.ts', // Barrel exports
      ],
      thresholds: {
        lines: 80,
        functions: 70,
        branches: 10, // Low branch coverage expected - utility functions with few branches
        statements: 80,
      },
    },
  },
});
