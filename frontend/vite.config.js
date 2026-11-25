import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: '/control-acceso/',
  server: {
    port: 5173,
    proxy: {
      '/control-acceso/api': {
        target: 'http://localhost:8010',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/control-acceso/, ''),
      },
      '/control-acceso/ws': {
        target: 'ws://localhost:8010',
        ws: true,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/control-acceso/, ''),
      },
      // Sin rewrite: con ROOT_PATH=/control-acceso el backend monta los
      // archivos estáticos en /control-acceso/storage, no en /storage.
      '/control-acceso/storage': {
        target: 'http://localhost:8010',
        changeOrigin: true,
      },
    },
  },
})