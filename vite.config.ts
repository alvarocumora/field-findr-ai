import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";
import { mcpPlugin } from "@lovable.dev/mcp-js/stacks/supabase/vite";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mcpPlugin(),
    mode === 'development' && componentTagger(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'favicon.ico', 'robots.txt'],
      manifest: false, // Use existing manifest.json
      workbox: {
        // Increase limit to handle large bundles - cache them via runtime caching instead
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024, // 10 MB
        // Only precache essential small files, large JS bundles will be cached at runtime
        globPatterns: ['**/*.{css,html,ico,png,svg,woff,woff2}'],
        runtimeCaching: [
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
          if (!id.includes('node_modules')) return;
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
          if (
            id.includes('jspdf') ||
            id.includes('jszip') ||
            id.includes('html2canvas') ||
            id.includes('canvg') ||
            id.includes('qrcode')
          ) return 'vendor-docs';
          if (id.includes('@turf') || id.includes('togeojson')) return 'vendor-geo';
        },
      },
    },
  },
}));
