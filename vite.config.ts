import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// Stable per-deploy release id: the commit sha in CI, otherwise build time.
const BUILD_ID = process.env.GITHUB_SHA ?? Date.now().toString(36);

// Stamps the release id into index.html so the client (releaseCheck.ts) can
// compare its running build against a freshly fetched document.
function buildIdMeta(): Plugin {
  return {
    name: 'gamehub-build-id',
    transformIndexHtml(html) {
      return html.replace('</head>', `    <meta name="build-id" content="${BUILD_ID}" />\n  </head>`);
    },
  };
}

export default defineConfig({
  define: {
    __BUILD_ID__: JSON.stringify(BUILD_ID),
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  plugins: [react(), buildIdMeta()],
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
