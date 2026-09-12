import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
//configuring vite with tailwind and react plugin
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(),],
})
