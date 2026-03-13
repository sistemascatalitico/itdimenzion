import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const zustandInFrontend = path.resolve(__dirname, 'node_modules/zustand')
const zustandInRoot = path.resolve(__dirname, '../node_modules/.pnpm')
// En pnpm, zustand está en .pnpm. Buscar el primer match (el path exacto puede variar)
const pnpmZustandMatch = fs.existsSync(zustandInRoot) && fs.readdirSync(zustandInRoot)
  .find(d => d.startsWith('zustand@'))
const zustandPath = fs.existsSync(zustandInFrontend)
  ? zustandInFrontend
  : pnpmZustandMatch
    ? path.resolve(zustandInRoot, pnpmZustandMatch, 'node_modules/zustand')
    : zustandInFrontend // fallback

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['zustand'],
  },
  resolve: {
    alias: {
      // Forzar resolución de zustand (pnpm monorepo: frontend o raíz/.pnpm)
      zustand: zustandPath,
    },
    dedupe: ['zustand', 'react', 'react-dom'],
  },
  esbuild: {
    // Eliminar console/debugger en producción de forma segura
    drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : [],
  },
  server: {
    port: 3701,
    host: true,
    cors: true,
    strictPort: false,
    watch: {
      usePolling: true,
      interval: 1000,
    },
    headers: {
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
    },
  },
  preview: {
    port: 3701,
    host: true,
    cors: true,
    headers: {
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false, // Deshabilitar source maps en producción por se1
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          mui: ['@mui/material', '@mui/icons-material'],
          forms: ['react-hook-form', '@hookform/resolvers', 'yup'],
        },
      },
    },
  },
})
