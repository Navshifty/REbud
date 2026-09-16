import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Tailwind is processed through PostCSS (see postcss.config.js),
// so only the React plugin is needed here.
// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
})
