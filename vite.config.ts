import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base: GitHub Pages serves from /henry-portfolio/
export default defineConfig({
  base: '/henry-portfolio/',
  plugins: [react()],
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 1300,
    // No manualChunks on purpose (F2): route-splitting in App.tsx sets the
    // boundaries, and auto-chunking keeps gsap/framer-features out of the
    // critical bundle. Forcing library chunks by hand created eager edges
    // (vendor → gsap) that dragged gsap back into the shell preload.
  },
})
