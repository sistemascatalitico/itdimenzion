import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { createRequire } from 'module'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Resolver zustand: frontend tiene la dep, pero en Vercel pnpm solo crea node_modules en raíz
// Usar frontend/package.json para que Node busque en frontend → parent (raíz con .pnpm)
function resolveZustandPath(): string {
  const inFrontend = path.resolve(__dirname, 'node_modules/zustand')
  if (fs.existsSync(inFrontend)) return inFrontend
  try {
    const req = createRequire(path.resolve(__dirname, 'package.json'))
    return req.resolve('zustand')
  } catch {
    return inFrontend
  }
}
const zustandPath = resolveZustandPath()

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
