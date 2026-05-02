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
    // Force esbuild for ARM compatibility (rolldown doesn't support ARM Alpine)
    rollupOptions: {
      // This will be ignored, but we keep it for reference
    },
    
    // Optimize build output for Raspberry Pi
    sourcemap: false, // Disable sourcemaps in production for smaller bundle
    minify: 'esbuild', // Use esbuild for ARM compatibility (rolldown not supported)
    target: 'es2015', // Better browser compatibility
    cssCodeSplit: true, // Split CSS for better caching
    cssMinify: 'lightningcss', // Faster CSS minification
    reportCompressedSize: true, // Report compressed sizes
    
    // esbuild minification options (simpler than terser but ARM-compatible)
    // Note: esbuild doesn't support all terser options, but it's faster and works on ARM
    
    // Code splitting optimization
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Vendor chunks for better caching
          if (id.includes('node_modules')) {
            // Core React libraries (most frequently used)
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react-core';
            }
            // React Router
            if (id.includes('react-router')) {
              return 'react-router';
            }
            // Material-UI core (large library, separate chunk)
            if (id.includes('@mui/material')) {
              return 'mui-core';
            }
            // Material-UI icons (lazy load, separate chunk)
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
            // Charting library (heavy, separate for lazy loading)
            if (id.includes('recharts')) {
              return 'charts';
            }
            // HTML to canvas (heavy, separate for lazy loading)
            if (id.includes('html2canvas')) {
              return 'html2canvas';
            }
            // Socket.io client
            if (id.includes('socket.io-client')) {
              return 'socket';
            }
            // Other vendors
            return 'vendor';
          }
        },
        // Optimize chunk names with content hash for better caching
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
    
    // Chunk size warnings (reduced for Pi)
    chunkSizeWarningLimit: 500,
  },
  
  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@mui/material',
      '@reduxjs/toolkit',
      'react-redux',
    ],
    // Exclude heavy libraries from pre-bundling (lazy load instead)
    exclude: [
      'html2canvas',
      'recharts',
    ],
  },
})
