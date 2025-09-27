import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://test.megamixsystems.com',
        changeOrigin: true,
        secure: false,
        cookieDomainRewrite: 'test.megamixsystems.com',
      },
    },
  },
})
