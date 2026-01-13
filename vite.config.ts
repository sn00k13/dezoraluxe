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
          // Don't manually chunk React/React-DOM - let Vite handle them automatically
          // This prevents "createContext" errors from React not being available
          if (id.includes('node_modules')) {
            // Explicitly exclude React and React-DOM from manual chunking
            // Vite will handle them automatically to ensure proper loading order
            if (
              id.includes('/react/') || 
              id.includes('/react-dom/') || 
              id.includes('react/jsx-runtime') ||
              id === 'react' ||
              id === 'react-dom'
            ) {
              // Don't return anything - let Vite handle React automatically
              return;
            }
            // React Router can be separate
            if (id.includes('react-router')) {
              return 'router-vendor';
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
    include: ['react', 'react-dom', 'react/jsx-runtime'],
    esbuildOptions: {
      target: 'es2020',
    },
  },
}));
