
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
<<<<<<< HEAD
    host: '127.0.0.1',
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8080',
        changeOrigin: true,
        secure: false,
=======
    // In development, requests to /api are proxied to the Spring Boot
    // backend so the browser sees a single origin (no CORS required).
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
>>>>>>> 3c0ee2c79f132e522dff7a4eab30667464e81af1
      },
    },
  },
})
