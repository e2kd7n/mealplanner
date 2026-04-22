import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: false,
  },
  build: {
    // Optimize build output
    sourcemap: false, // Disable sourcemaps in production for smaller bundle
    minify: 'esbuild', // Use esbuild for faster minification
    target: 'es2015', // Better browser compatibility
    cssCodeSplit: true, // Split CSS for better caching
    reportCompressedSize: true, // Report compressed sizes
    // Code splitting optimization
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Vendor chunks for better caching
          if (id.includes('node_modules')) {
            // Core React libraries
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react-core';
            }
            // React Router
            if (id.includes('react-router')) {
              return 'react-router';
            }
            // Material-UI core
            if (id.includes('@mui/material')) {
              return 'mui-core';
            }
            // Material-UI icons (separate for lazy loading)
            if (id.includes('@mui/icons-material')) {
              return 'mui-icons';
            }
            // Redux and toolkit
            if (id.includes('redux') || id.includes('@reduxjs')) {
              return 'redux';
            }
            // Form libraries
            if (id.includes('react-hook-form') || id.includes('zod')) {
              return 'forms';
            }
            // Date libraries
            if (id.includes('date-fns')) {
              return 'date-utils';
            }
            // Other vendors
            return 'vendor';
          }
        },
        // Optimize chunk names
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
    // Chunk size warnings
    chunkSizeWarningLimit: 1000,
  },
  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@mui/material',
      '@mui/icons-material',
      '@reduxjs/toolkit',
      'react-redux',
    ],
  },
})
