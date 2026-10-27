import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  base: './',
  plugins: [react()],
  server: { fs: { allow: [fileURLToPath(new URL('..', import.meta.url))] } },
  build: { target: 'es2022', chunkSizeWarningLimit: 800 },
})
