import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';
import path from 'path';

const isAnalyze = process.env.ANALYZE === 'true';

export default defineConfig({
  plugins: [
    react(),
    ...(isAnalyze ? [visualizer({ open: true, filename: 'dist/src/admin/stats.html', gzipSize: true })] : []),
  ],
  root: 'src/admin',
  base: '/admin/',
  build: {
    // Output to where compiled index.js expects it: path.join(__dirname, 'admin')
    outDir: '../../dist/src/admin',
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3002',
        changeOrigin: true,
      },
    },
  },
});
