import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Vite dev server runs on :5173 (matches backend CORS).
// API base URL is read from VITE_API_BASE (default localhost:8000).
export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
})
