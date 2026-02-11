/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dirname = typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => ({
  plugins: [react()],

  // Path aliases
  resolve: {
    alias: {
      '@': path.resolve(dirname, './src'),
    },
  },

  // Dev server
  server: {
    port: 8090,
    strictPort: false,
    proxy: {
      '/api': {
        target: 'http://localhost:8099',
        changeOrigin: true,
        secure: false,
      },
    },
  },

  // Preview server (for testing production builds locally)
  preview: {
    port: 8090,
    strictPort: false,
  },

  // Build optimizations
  build: {
    target: 'es2020',
    outDir: 'dist',
    sourcemap: mode === 'production' ? 'hidden' : true,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: mode === 'production',
        drop_debugger: true,
        pure_funcs: mode === 'production' ? ['console.log', 'console.debug'] : [],
      },
    },
    // Chunk splitting for optimal caching
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React runtime
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // Data layer
          'vendor-data': ['@tanstack/react-query', 'zustand'],
          // Charts (large dependency, load on demand)
          'vendor-charts': ['recharts'],
          // UI utilities
          'vendor-ui': ['clsx', 'tailwind-merge', 'cmdk', 'react-hotkeys-hook'],
          // Date utilities
          'vendor-date': ['date-fns'],
        },
        // Cleaner asset file names
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
      },
    },
    // Warn on large chunks
    chunkSizeWarningLimit: 500,
    // Enable CSS code splitting
    cssCodeSplit: true,
    // Asset inlining threshold (4kb)
    assetsInlineLimit: 4096,
  },

  // CSS configuration
  css: {
    devSourcemap: true,
  },

  // Optimize dependency pre-bundling
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@tanstack/react-query',
      'zustand',
      'clsx',
      'tailwind-merge',
    ],
  },
}));
