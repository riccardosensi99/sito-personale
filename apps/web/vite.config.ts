import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Le variabili stanno nel .env alla radice del monorepo, condiviso con l'API e con docker.
  const env = loadEnv(mode, '../../', '');

  // Canonical, og:url e og:image devono nominare l'ambiente in cui il bundle è
  // stato costruito, non uno scritto a mano dentro index.html. Il valore manca
  // solo in un build fatto senza .env: meglio la produzione di un %SITE_URL%
  // lasciato a metà nell'HTML.
  const siteUrl = (env.VITE_SITE_URL || 'https://riccardosensi.com').replace(/\/+$/, '');

  return {
    plugins: [
      react(),
      {
        name: 'rs-site-url',
        transformIndexHtml: (html) => html.replaceAll('%SITE_URL%', siteUrl),
      },
    ],
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
          // Qui dentro solo react: il backoffice si separa da sé, perché è
          // importato con lazy() e Rollup lo taglia da solo in un chunk asincrono.
          //
          // Ce n'era una regola anche per lui, e otteneva l'opposto di quel che
          // prometteva: un chunk *nominato* a mano Vite lo considera parte del
          // grafo dell'entry e ne scrive i link dentro index.html — un
          // <link rel="stylesheet"> che blocca il rendering più un modulepreload
          // da 79KB, entrambi davanti a react nella coda. Il sito pubblico si
          // scaricava tutto il backoffice per non usarlo mai. La pagina dei
          // cookie, che è lazy e non aveva nessuna regola, si comportava già bene:
          // era la prova che la regola non serviva a niente se non a far danno.
          manualChunks(id) {
            if (id.includes('node_modules/react')) return 'react-vendor';
            return undefined;
          },
        },
      },
    },
  };
});
