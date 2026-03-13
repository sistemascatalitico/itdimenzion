import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Resolver base de zustand (frontend o raíz/.pnpm para Vercel)
function getZustandDir(): string | null {
  const inFrontend = path.resolve(__dirname, 'node_modules/zustand')
  if (fs.existsSync(inFrontend)) return inFrontend
  const pnpmRoot = path.resolve(__dirname, '../node_modules/.pnpm')
  if (fs.existsSync(pnpmRoot)) {
    const match = fs.readdirSync(pnpmRoot).find((d) => d.startsWith('zustand@'))
    if (match) {
      const zustandDir = path.join(pnpmRoot, match, 'node_modules/zustand')
      if (fs.existsSync(zustandDir)) return zustandDir
    }
  }
  return null
}

// Plugin: resolver zustand en Vercel (pnpm solo crea node_modules en raíz)
function resolveZustandPlugin() {
  return {
    name: 'resolve-zustand',
    enforce: 'pre' as const,
    resolveId(id: string) {
      if (id !== 'zustand' && !id.startsWith('zustand/')) return null
      const zustandDir = getZustandDir()
      if (!zustandDir) return null
      const subpath = id === 'zustand' ? 'index.js' : id.replace('zustand/', '') + '.js'
      const entry = path.join(zustandDir, subpath)
      return fs.existsSync(entry) ? entry : null
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [resolveZustandPlugin(), react()],
  optimizeDeps: {
    include: ['zustand'],
  },
  resolve: {
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
