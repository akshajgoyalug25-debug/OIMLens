import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'favicon.svg',
        'logo.png',
        'icons.svg',
      ],
      manifest: {
        name: 'OIMLense — SIH26035',
        short_name: 'OIMLense',
        description:
          'OIML R 76 digital testing and compliance verification system.',
        theme_color: '#f4f0e8',
        background_color: '#f4f0e8',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/logo.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
        ],
      },
    }),
  ],
  server: {
    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'https://oimlense-backend.onrender.com',
        changeOrigin: true,
      },
    },
  },
})
