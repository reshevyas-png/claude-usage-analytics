import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/auth': 'http://localhost:8000',
      '/keys': 'http://localhost:8000',
      '/analytics': 'http://localhost:8000',
      '/v1': 'http://localhost:8000',
    },
  },
})
