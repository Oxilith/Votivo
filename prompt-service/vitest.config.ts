/**
 * @file vitest.config.ts
 * @purpose Vitest test configuration for prompt-service microservice
 * @functionality
 * - Configures test environment for Node.js
 * - Sets up coverage reporting with thresholds
 * - Excludes admin UI from test coverage
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
    exclude: ['src/admin/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.d.ts',
        'src/**/*.test.ts',
        'src/**/*.spec.ts',
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
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
