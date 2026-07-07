import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base: GitHub Pages serves from /henry-portfolio/
export default defineConfig({
  base: '/henry-portfolio/',
  plugins: [react()],
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 1300,
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (!id.includes('node_modules')) return undefined
          if (/[\\/](three|@react-three|postprocessing|maath|meshline)[\\/]/.test(id)) {
            return 'three'
          }
          if (/[\\/](gsap|@gsap|framer-motion|motion-dom|motion-utils|lenis)[\\/]/.test(id)) {
            return 'motion'
          }
          return 'vendor'
        },
      },
    },
  },
})
