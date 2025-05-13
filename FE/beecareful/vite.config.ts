import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import fs from 'fs';

export default defineConfig(({ mode }) => {
  const isDev = mode === 'development';

  return {
    ...(isDev && {
      server: {
        https: {
          key: fs.readFileSync('./certs/localhost+2-key.pem'),
          cert: fs.readFileSync('./certs/localhost+2.pem'),
        },
        proxy: {
          '/api': {
            target: 'https://k12a203.p.ssafy.io',
            changeOrigin: true,
            secure: false,
            cookieDomainRewrite: 'localhost', // <-- change cookie domain
          },
        },
      },
    }),
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
  };
});
