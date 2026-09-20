import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: { port: 5175 },
  preview: {
    allowedHosts: ['erp-in-aat-production.up.railway.app'],
  },
})
