import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt', 'apple-touch-icon.png'],
      manifest: {
        name: '비케어풀 - 꿀벌 통합 관리 시스템',
        short_name: '비케어풀',
        theme_color: '#F7D143',
        icons: [
          {
            src: '/icons/beecareful-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icons/beecareful-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
    }),
  ],
  css: {
    postcss: './postcss.config.js',
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  publicDir: 'public',
});
