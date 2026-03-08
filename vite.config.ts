import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate', // Añadido para que se actualice sola
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        name: 'Master Paleo Analytics',
        short_name: 'PaleoAnalytics',
        description: 'A comprehensive dashboard to manage and visualize rowing training data.',
        theme_color: '#2563eb',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/Paleo/', // 👈 Cambiado de '.' a '/Paleo/'
        scope: '/Paleo/',      // 👈 Cambiado de '.' a '/Paleo/'
        orientation: 'any',
        icons: [
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true
      }
    })
  ],
  base: '/Paleo/', // 👈 ESTE ES EL CAMBIO VITAL
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false
  }
});
