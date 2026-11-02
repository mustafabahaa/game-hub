import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: [
        'favicon-light.png',
        'logo-black.png',
        'icons/apple-touch-icon.png',
        'icons/icon-192.png',
        'icons/icon-512.png',
        'icons/maskable-192.png',
        'icons/maskable-512.png',
      ],
      // The manifest link lives in index.html; the app name/artwork is owned
      // by the icon pipeline (npm run icons).
      manifest: false,
      // Registration happens in AppUpdatePrompt via virtual:pwa-register so a
      // waiting build prompts the user instead of activating mid-session.
      injectRegister: false,
      workbox: {
        maximumFileSizeToCacheInBytes: 5_000_000,
        // skipWaiting must stay off: an immediate activation swaps the
        // precache under the running app and breaks lazy navigation.
        // clientsClaim only takes over uncontrolled first loads (safe).
        skipWaiting: false,
        clientsClaim: true,
        // OAuth and MCP endpoints must reach the server rather than the offline app shell.
        navigateFallbackDenylist: [
          /^\/(?:authorize|token|register|revoke)(?:[/?]|$)/,
          /^\/\.well-known\//,
          /^\/mcp-auth\//,
          /^\/mcp(?:[?]|$)/,
        ],
      },
    }),
  ],
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('firebase')) {
              return 'firebase-vendor';
            }
            if (id.includes('@mui') || id.includes('@emotion')) {
              return 'mui-vendor';
            }
            if (id.includes('gsap') || id.includes('@gsap')) {
              return 'gsap-vendor';
            }
          }
        },
      },
    },
  },
});
