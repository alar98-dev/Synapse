import { defineConfig } from 'vite'
import path from 'path'
import { fileURLToPath } from 'url'
import react from '@vitejs/plugin-react'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ESM Vite config to ensure @vitejs/plugin-react loads correctly in this environment.
export default defineConfig({
  plugins: [react()],
  root: __dirname,
  server: {
    host: true, // expose on 0.0.0.0
    port: 5173,
    proxy: {
      // Proxy API requests to backend in development. Override with BACKEND env var.
      '/api': {
        target: process.env.BACKEND || 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, '/api')
      }
    },
  },
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html')
      }
    }
  },
  optimizeDeps: {
    entries: [path.resolve(__dirname, 'index.html')]
  }
})
