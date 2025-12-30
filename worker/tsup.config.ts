import { defineConfig } from 'tsup';
export default defineConfig({
    entry: ['src/**/*.ts', '!src/**/__tests__/**'],
    format: ['esm'],
    dts: true,
    clean: true,
    sourcemap: true,
    splitting: false,
});
