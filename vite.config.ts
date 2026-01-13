import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Bundle React, React-DOM, and React Router together
          // This prevents "SECRET_INTERNALS" errors from React Router loading before React
          if (id.includes('node_modules')) {
            // Bundle React, React-DOM, and React Router together
            if (
              id.includes('/react/') || 
              id.includes('/react-dom/') || 
              id.includes('react/jsx-runtime') ||
              id.includes('react-router') ||
              id === 'react' ||
              id === 'react-dom'
            ) {
              // Bundle React ecosystem together to ensure proper loading order
              return 'react-vendor';
            }
            // Large UI libraries
            if (id.includes('@radix-ui')) {
              return 'ui-vendor';
            }
            if (id.includes('@tanstack/react-query')) {
              return 'query-vendor';
            }
            if (id.includes('react-hook-form') || id.includes('@hookform')) {
              return 'form-vendor';
            }
            // Other large node_modules
            if (id.includes('lucide-react') || id.includes('recharts') || id.includes('sonner')) {
              return 'vendor';
            }
          }
          // Admin pages (large dashboard)
          if (id.includes('/admin/')) {
            return 'admin';
          }
          // Auth pages
          if (id.includes('/SignIn') || id.includes('/SignUp') || id.includes('/AuthCallback')) {
            return 'auth';
          }
          // Product pages
          if (id.includes('/ProductDetail') || id.includes('/AllProducts') || id.includes('/AllCategories')) {
            return 'products';
          }
          // Checkout flow
          if (id.includes('/Cart') || id.includes('/Checkout') || id.includes('/OrderConfirmation')) {
            return 'checkout';
          }
        },
      },
    },
    chunkSizeWarningLimit: 1000, // Increase limit to 1MB for better chunking
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true,
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react/jsx-runtime', 'react-router-dom'],
    esbuildOptions: {
      target: 'es2020',
    },
  },
}));
