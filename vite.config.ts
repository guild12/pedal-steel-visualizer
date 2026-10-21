import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  // BASE_PATH is set when building for a GitHub Pages project site (e.g. /repo-name/).
  base: process.env.BASE_PATH ?? '/',
  plugins: [
    react(),
    tailwindcss(),
  ],
})
