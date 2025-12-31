import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'
import path from 'path'
import fs from 'fs'

const isAnalyze = process.env.ANALYZE === 'true'

export default defineConfig({
    plugins: [
        react(),
        ...(isAnalyze ? [visualizer({ open: true, filename: 'dist/stats.html', gzipSize: true })] : []),
    ],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
            // No shared alias needed - resolves via node_modules
        },
    },
    server: {
        port: 3000,
        https: fs.existsSync(path.resolve(__dirname, '../certs/localhost+2.pem'))
            ? {
                key: fs.readFileSync(path.resolve(__dirname, '../certs/localhost+2-key.pem')),
                cert: fs.readFileSync(path.resolve(__dirname, '../certs/localhost+2.pem')),
            }
            : undefined,
    },
})