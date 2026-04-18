import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    // Split large vendors into named chunks to reduce single chunk size
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Map node_modules package to a named vendor chunk by package name.
          // This avoids circular chunking and creates predictable vendor bundles.
          if (!id.includes('node_modules')) return null;

          const parts = id.split('node_modules/')[1].split('/');
          const pkg = parts[0].startsWith('@') ? parts.slice(0,2).join('/') : parts[0];

          // Only split out known large/important vendor packages. For all other
          // packages, return null and let Rollup optimize them into existing
          // vendor bundles. This avoids creating many small or empty chunks.
          const whitelist = new Set([
            'recharts',
            'react',
            'react-dom',
            'react-icons',
            '@stripe/react-stripe-js',
            '@stripe/stripe-js',
            'axios',
            'react-router-dom'
          ]);

          if (!whitelist.has(pkg)) return null;

          switch (pkg) {
            case 'recharts':
              return 'vendor-recharts';
            case 'react':
            case 'react-dom':
              return 'vendor-react';
            case 'react-icons':
              return 'vendor-icons';
            case '@stripe/react-stripe-js':
            case '@stripe/stripe-js':
              return 'vendor-stripe';
            case 'axios':
              return 'vendor-axios';
            case 'react-router-dom':
              return 'vendor-react-router-dom';
            default:
              return null;
          }
        }
      }
    }
  },
})
