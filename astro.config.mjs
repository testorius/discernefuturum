// @ts-check

import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';

/** @type {import('astro').AstroUserConfig} */
export default defineConfig({
  // Add React and other integrations
  integrations: [
    tailwind(),
    react(),
    sitemap({
      filter: (page) => {
        const excludedPages = ['/impressum', '/impressum/'];
        return !excludedPages.includes(new URL(page).pathname);
      },
      changefreq: 'weekly',
      priority: 0.7,
    }),
  ],

  // Improve build output
  build: {
    // Enhance assets handling
    assets: '_assets',
    // Improve CSS bundling
    inlineStylesheets: 'auto',
  },

  // Add output configuration
  output: 'static',
  //adapter: cloudflare(),

  // Add compress option for production builds
  compressHTML: true,

  // Add site configuration
  site: 'https://testorius.github.io',
  base: '/discernefuturum',

  // Add server configuration for development
  server: {
    port: 3000,
    host: true,
  },

  // Add vite configuration for better performance
  vite: {
    build: {
      // Enable CSS code splitting
      cssCodeSplit: true,
      // Enable minification
      minify: 'terser',
      // Configure terser for better compression
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true,
        },
      },
      assetsDir: '_assets',
      rollupOptions: {
        output: {
          assetFileNames: 'assets/[name].[hash][extname]',
          chunkFileNames: 'assets/[name].[hash].js',
          entryFileNames: 'assets/[name].[hash].js',
        },
      },
    },
    // Add cache busting for assets
    assetsInclude: ['**/*.svg', '**/*.png', '**/*.jpg', '**/*.jpeg', '**/*.gif'],
    // Optimize deps
    optimizeDeps: {
      exclude: ['@astrojs/react'],
    },
    plugins: [
      {
        name: 'configure-response-headers',
        configureServer: (server) => {
          server.middlewares.use((req, res, next) => {
            // Cache static assets for 1 year
            if (req.url?.includes('.') && !req.url?.includes('hot-update')) {
              res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
            }
            next();
          });
        },
      },
    ],
  },

  image: {
    service: {
      entrypoint: 'astro/assets/services/sharp'
    }
  }
});
