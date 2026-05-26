import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

// Relative base keeps asset URLs correct whether the site is served from a
// project Pages path (/klustr/) or a custom domain at the root.
export default defineConfig({
  base: './',
  plugins: [tailwindcss()],
})
