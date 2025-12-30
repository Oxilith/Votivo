import { defineConfig } from 'tsup';

export default defineConfig({
    entry: ['src/**/*.ts', 'prisma/**/*.ts', 'scripts/**/*.ts', '!src/admin/**', '!src/**/__tests__/**'],
    format: ['esm'],
    dts: true,
    clean: true,
    sourcemap: true,
    splitting: false,
  // Exclude admin UI files (handled by vite)
  external: ['react', 'react-dom'],
});
