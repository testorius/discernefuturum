// @ts-check

import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import react from '@astrojs/react';
import cloudflare from '@astrojs/cloudflare';
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
      priority: 1.0,
      lastmod: new Date(),
    }),
  ],

  // Improve build output
  build: {
    // Enhance assets handling
    assets: 'assets',
    // Improve CSS bundling
    inlineStylesheets: 'auto',
  },

  // Add output configuration
  output: 'server',
  adapter: cloudflare(),

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
    },
    // Add cache busting for assets
    assetsInclude: ['**/*.svg', '**/*.png', '**/*.jpg', '**/*.jpeg', '**/*.gif'],
    // Optimize deps
    optimizeDeps: {
      exclude: ['@astrojs/react'],
    },
  },

  // Content collection settings (optional)
  content: {
    collections: {
      // If you need any special collection-level settings
    }
  }
});
