// @ts-check
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import react from '@astrojs/react';

import cloudflare from '@astrojs/cloudflare';

/** @type {import('astro').AstroUserConfig} */
export default defineConfig({
  // Add React to your existing integrations
  integrations: [
    tailwind(),
    react()
  ],

  // Improve build output
  build: {
    // Enhance assets handling
    assets: 'assets',
    // Improve CSS bundling
    inlineStylesheets: 'auto'
  },

  // Add output configuration
  output: 'server',

  // Add compress option for production builds
  compressHTML: true,

  // Add site configuration (replace with your actual URL in production)
  site: 'https://alexanderpaul.ch',

  // Add server configuration for development
  server: {
    port: 3000,
    host: true
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
          drop_debugger: true
        }
      }
    },
    // Add cache busting for assets
    assetsInclude: ['**/*.svg', '**/*.png', '**/*.jpg', '**/*.jpeg', '**/*.gif'],
    // Optimize deps
    optimizeDeps: {
      exclude: ['@astrojs/react']
    }
  },

  adapter: cloudflare()
});