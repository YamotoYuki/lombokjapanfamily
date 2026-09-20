import { defineConfig, type PluginOption } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { createRequire } from 'node:module';
import { fileURLToPath, URL } from 'node:url';

const require = createRequire(import.meta.url);

function loadPwaPlugin(): PluginOption[] {
  try {
    const { VitePWA } = require('vite-plugin-pwa') as {
      VitePWA: (options: Record<string, unknown>) => PluginOption;
    };
    return [
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: [
          'favicon.ico',
          'favicon-16x16.png',
          'favicon-32x32.png',
          'favicon-48x48.png',
          'apple-touch-icon.png',
          'robots.txt',
          'offline.html',
        ],
        manifest: {
          name: 'Lombok-Japan Family',
          short_name: 'LJF',
          description: 'Lombok-Japan Family official website',
          theme_color: '#0A2342',
          background_color: '#0A2342',
          display: 'standalone',
          start_url: '/',
          lang: 'ja',
          icons: [
            {
              src: '/android-chrome-192x192.png',
              sizes: '192x192',
              type: 'image/png',
            },
            {
              src: '/android-chrome-512x512.png',
              sizes: '512x512',
              type: 'image/png',
            },
            {
              src: '/android-chrome-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable',
            },
          ],
        },
        workbox: {
          navigateFallback: '/index.html',
          navigateFallbackDenylist: [/^\/api\//],
          additionalManifestEntries: [{ url: '/offline.html', revision: '1' }],
          runtimeCaching: [
            {
              urlPattern: ({ request }: { request: Request }) =>
                request.destination === 'image',
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'ljf-images',
                expiration: {
                  maxEntries: 80,
                  maxAgeSeconds: 60 * 60 * 24 * 7,
                },
              },
            },
            {
              urlPattern: ({ url }: { url: URL }) =>
                url.pathname.startsWith('/api/'),
              handler: 'NetworkFirst',
              options: {
                cacheName: 'ljf-api',
                networkTimeoutSeconds: 8,
                expiration: { maxEntries: 40, maxAgeSeconds: 60 * 5 },
              },
            },
          ],
        },
      }),
    ];
  } catch {
    console.warn(
      '[vite] vite-plugin-pwa is not installed. PWA disabled for this build.',
    );
    return [];
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), ...loadPwaPlugin()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          charts: ['recharts'],
          query: ['@tanstack/react-query'],
        },
      },
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
      },
    },
  },
});
