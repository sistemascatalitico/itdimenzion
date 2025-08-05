import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true,
    cors: true,
    headers: {
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
    },
  },
  preview: {
    port: 3000,
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
    sourcemap: false, // Deshabilitar source maps en producción por seguridad
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
  define: {
    // Eliminar console.log en producción
    ...(process.env.NODE_ENV === 'production' && {
      'console.log': 'void 0',
      'console.warn': 'void 0',
      'console.error': 'void 0',
    }),
  },
})
