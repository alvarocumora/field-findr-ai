import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";
import { mcpPlugin } from "@lovable.dev/mcp-js/stacks/supabase/vite";
import { projectSocialPlugin } from './scripts/project-social-plugin';

// Public browser configuration. Lovable Cloud normally injects these values,
// but classic Vite production builds must still initialize when the managed
// root .env is not present in the deployment checkout.
const PUBLIC_SUPABASE_URL = "https://gqcizjridfkiacpqcoqs.supabase.co";
const PUBLIC_SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdxY2l6anJpZGZraWFjcHFjb3FzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0NDYxMjIsImV4cCI6MjA4NTAyMjEyMn0.qX_7oongmcfi5Txidgt9Jkax8FoyPFPDXWKAtPIQx34";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  define: {
    "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(
      process.env.VITE_SUPABASE_URL || PUBLIC_SUPABASE_URL,
    ),
    "import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY": JSON.stringify(
      process.env.VITE_SUPABASE_PUBLISHABLE_KEY || PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    ),
  },
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mcpPlugin(),
    projectSocialPlugin(
      process.env.VITE_SUPABASE_URL || PUBLIC_SUPABASE_URL,
      process.env.VITE_SUPABASE_PUBLISHABLE_KEY || PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    ),
    mode === 'development' && componentTagger(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'favicon.ico', 'robots.txt'],
      manifest: false, // Use existing manifest.json
      workbox: {
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024, // 10 MB
        // Precache the JS bundles TOO, not just html/css. Previously js was
        // excluded, so the SW served a cached index.html that referenced old
        // hashed chunks (index-<oldhash>.js) which 404 after a redeploy →
        // white screen on the live domain. Precaching js keeps index.html and
        // its exact chunks a consistent, atomically-updated set.
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        cleanupOutdatedCaches: true,
        // Never let the service worker answer OAuth callbacks with the cached
        // app shell — the popup must reach the real /~oauth/* endpoint or it
        // renders our 404 page and the Google sign-in never completes.
        navigateFallbackDenylist: [/^\/~oauth/, /^\/auth\/v1\//],
        runtimeCaching: [
          // Always hit the network for the OAuth handshake.
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/~oauth'),
            handler: 'NetworkOnly',
          },
          // Cache Mapbox tiles for offline map access
          {
            urlPattern: /^https:\/\/api\.mapbox\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'mapbox-tiles-cache',
              expiration: {
                maxEntries: 500,
                maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          // Cache Mapbox static assets
          {
            urlPattern: /^https:\/\/.*\.mapbox\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'mapbox-assets-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          // Cache Supabase API responses for offline data
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24, // 1 day
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
              networkTimeoutSeconds: 5,
            },
          },
          // Cache images
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
            },
          },
          // Cache fonts
          {
            urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
            },
          },
        ],
      },
      devOptions: {
        enabled: false, // Disable in development
      },
    }),
  ].filter(Boolean),
  resolve: {
    dedupe: ['react', 'react-dom'],
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Split heavy, page-specific vendor libraries into their own cacheable
        // chunks so they don't bloat the shared entry chunk (was ~7.3 MB).
        manualChunks(id) {
          // Vite virtual helpers (\0vite/preload-helper etc.) must live in a
          // chunk that loads first: jspdf's internal dynamic import('canvg')
          // made rollup place the preload helper INSIDE vendor-pdf, forcing
          // the entry to preload jspdf on every page just to reach it.
          if (
            id.includes('vite/preload-helper') ||
            id.includes('vite/modulepreload-polyfill') ||
            id.includes('commonjsHelpers')
          ) {
            return 'vendor-react';
          }
          if (!id.includes('node_modules')) return;
          // Pin the framework to its own chunk FIRST: without this, rollup can
          // hoist react/react-dom into whichever vendor chunk references them
          // earliest (it landed inside vendor-charts), forcing the entry —
          // and therefore every page — to preload charts/three/docs.
          if (
            id.includes('node_modules/react/') ||
            id.includes('node_modules/react-dom/') ||
            id.includes('node_modules/scheduler/') ||
            id.includes('node_modules/react-is/') ||
            // Tiny helpers shared between the app and the heavy libs — pin
            // them here too or they get hoisted into charts/docs the same way.
            id.includes('node_modules/clsx/') ||
            id.includes('node_modules/tslib/') ||
            id.includes('node_modules/@babel/runtime/')
          ) return 'vendor-react';
          if (id.includes('mapbox-gl') || id.includes('@mapbox')) return 'vendor-mapbox';
          if (
            id.includes('/three/') ||
            id.includes('@react-three') ||
            id.includes('troika') ||
            id.includes('three-mesh-bvh') ||
            id.includes('three-stdlib')
          ) return 'vendor-three';
          if (id.includes('@photo-sphere-viewer') || id.includes('photo-sphere')) return 'vendor-psv';
          if (id.includes('recharts') || id.includes('/d3-') || id.includes('victory-vendor')) return 'vendor-charts';
          if (id.includes('jspdf')) return 'vendor-pdf';
          if (id.includes('jszip')) return 'vendor-zip';
          if (id.includes('html2canvas') || id.includes('canvg')) return 'vendor-h2c';
          if (id.includes('qrcode')) return 'vendor-qr';
          if (id.includes('@turf') || id.includes('togeojson')) return 'vendor-geo';
        },
      },
    },
  },
}));
