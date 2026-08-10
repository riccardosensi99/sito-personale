import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Le variabili stanno nel .env alla radice del monorepo, condiviso con l'API e con docker.
  const env = loadEnv(mode, '../../', '');

  return {
    plugins: [react()],
    envDir: '../../',
    server: {
      host: true,
      port: 5173,
      proxy: {
        '/api': {
          target: env.VITE_DEV_API_TARGET || 'http://localhost:3000',
          changeOrigin: true,
        },
        '/uploads': {
          target: env.VITE_DEV_API_TARGET || 'http://localhost:3000',
          changeOrigin: true,
        },
      },
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
      rollupOptions: {
        output: {
          // L'admin resta in un chunk separato: chi visita il sito pubblico non lo scarica mai.
          manualChunks(id) {
            if (id.includes('/src/pages/admin/') || id.includes('/src/components/admin/')) {
              return 'admin';
            }
            if (id.includes('node_modules/react')) return 'react-vendor';
            return undefined;
          },
        },
      },
    },
  };
});
