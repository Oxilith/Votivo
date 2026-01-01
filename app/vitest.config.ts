/**
 * @file vitest.config.ts
 * @purpose Vitest test configuration for React app
 * @functionality
 * - Configures test environment (jsdom)
 * - Uses projects for unit test organization
 * - Sets up path aliases matching vite.config
 * - Configures coverage reporting with thresholds
 * - Sets up global test utilities
 * @dependencies
 * - vitest
 * - @vitejs/plugin-react
 */

import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
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
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.d.ts',
        'src/test/**',
        'src/main.tsx',
        'src/vite-env.d.ts',
        // Landing pages - static marketing content
        'src/components/landing/**',
        // Icons - pure presentational SVG wrappers
        'src/components/shared/icons/**',
        // Context providers - thin React context wrappers
        'src/components/providers/**',
        // Barrel files - pure re-exports
        'src/**/index.ts',
        // i18n config - external library configuration
        'src/i18n/**',
        // Type definitions - no runtime code
        'src/types/**',
        // Styles - pure CSS utilities
        'src/styles/**',
        // App root - integration layer
        'src/App.tsx',
        // Theme hooks - thin context wrappers
        'src/hooks/useTheme.ts',
        'src/hooks/useThemeContext.ts',
        'src/hooks/useScrollReveal.ts',
        // Service interfaces - pure type definitions
        'src/services/interfaces/**',
        // Data files - static data
        'src/data/**',
        // Thin UI wrappers with minimal logic
        'src/components/shared/ThemeToggle.tsx',
        'src/components/shared/UserDropdown.tsx',
        'src/components/shared/PageNavigation.tsx',
        // Utils - responseFormatter is re-export from shared
        'src/utils/responseFormatter.ts',
        // Assessment types - pure type definitions
        'src/components/assessment/types.ts',
      ],
      thresholds: {
        lines: 75,
        functions: 75,
        branches: 75,
        statements: 75,
      },
    },
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          environment: 'jsdom',
          setupFiles: ['./src/test/setup.ts'],
          include: ['__tests__/unit/**/*.test.{ts,tsx}'],
          exclude: ['node_modules', 'dist'],
          testTimeout: 10000,
        },
      },
    ],
  },
});
