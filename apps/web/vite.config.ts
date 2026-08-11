import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Le variabili stanno nel .env alla radice del monorepo, condiviso con l'API e
 * con docker. Da lì arriva anche `NODE_ENV=development`, che per l'API è giusto
 * e qui era un disastro: Vite legge NODE_ENV dai file d'ambiente e ci decide
 * `isProduction`, da cui dipendono sia quale delle due copie di react-dom finisce
 * nel bundle sia se il JSX viene compilato con le informazioni di debug. Bastava
 * quella riga per costruire un sito che pesava il doppio del vero.
 *
 * Per questo lo script di build in package.json lancia `NODE_ENV=production vite
 * build`: se la variabile è già nell'ambiente del processo, Vite non lascia che i
 * file la sovrascrivano. Non si può rimediare da qui dentro — quando questa
 * funzione viene chiamata, la decisione è già stata presa.
 *
 * In docker non si vedeva perché lì il .env non viene copiato: il build era
 * giusto, e sbagliate erano solo le misure fatte sulla macchina di sviluppo.
 */
export default defineConfig(({ mode }) => {
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
      {
        // Il foglio del sito non deve bloccare il primo disegno.
        //
        // Un <link rel="stylesheet"> in head ferma il rendering di tutta la
        // pagina finché non è sceso, e il nostro pesa 63KB: la copertina, che
        // ha il suo stile in linea proprio per essere dipinta subito, restava
        // ferma ad aspettarlo. Caricato come media="print" non blocca, e
        // all'onload torna buono per tutti i media.
        //
        // Non c'è rischio di contenuto senza stile: sotto la copertina non si
        // dipinge niente finché React non è arrivato, e React è sei volte più
        // pesante di questo foglio.
        name: 'rs-css-non-bloccante',
        enforce: 'post',
        transformIndexHtml: (html) =>
          html.replace(
            /<link rel="stylesheet"((?:(?!\bmedia=)[^>])*?)>/g,
            `<link rel="stylesheet"$1 media="print" onload="this.media='all';this.onload=null">`,
          ),
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
