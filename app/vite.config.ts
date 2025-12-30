import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import fs from 'fs'

export default defineConfig({
    plugins: [react()],
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