import { useEffect } from 'react';

/**
 * La testa del documento, una per rotta.
 *
 * index.html ne porta una sola, quella della home, e in una SPA resterebbe
 * addosso a tutto il resto: /cookie e il backoffice si ritroverebbero titolo e
 * descrizione della home e un canonical che punta altrove. Qui ogni pagina
 * dichiara i suoi, e tornando indietro la home si riprende i propri.
 */

/// Lo stesso indirizzo che vite.config.ts scrive dentro index.html: cambia per
/// ambiente, e in locale vale `http://localhost:8080`.
export const SITE_URL = (import.meta.env.VITE_SITE_URL || 'https://riccardosensi.com').replace(
  /\/+$/,
  '',
);

/// Copia dei meta scritti a mano in index.html. Sta qui perché la home deve
/// poterseli rimettere dopo un giro su /cookie: se cambia uno, cambiano tutti e
/// due i posti.
export const SEO_HOME = {
  titolo: 'Riccardo Sensi — Full Stack Developer',
  descrizione:
    'Full stack developer. Costruisco gestionali, automazioni e interfacce che reggono anche quando i dati veri arrivano tutti insieme.',
  path: '/',
};

type Seo = {
  titolo: string;
  descrizione: string;
  /** Percorso canonico, con lo slash davanti. Senza, la pagina non ne ha uno. */
  path?: string;
  /** Solo dove non si vuole essere indicizzati: altrove il tag non compare. */
  robots?: string;
};

/** Il tag se già c'è, creato se manca: index.html ne porta alcuni e non tutti. */
function meta(chiave: 'name' | 'property', valore: string): HTMLMetaElement {
  const esistente = document.head.querySelector<HTMLMetaElement>(`meta[${chiave}="${valore}"]`);
  if (esistente) return esistente;
  const nuovo = document.createElement('meta');
  nuovo.setAttribute(chiave, valore);
  document.head.appendChild(nuovo);
  return nuovo;
}

export function useSeo({ titolo, descrizione, path, robots }: Seo) {
  useEffect(() => {
    document.title = titolo;
    meta('name', 'description').content = descrizione;
    meta('property', 'og:title').content = titolo;
    meta('property', 'og:description').content = descrizione;

    // Senza path la pagina non è una destinazione: meglio nessun canonical di
    // uno ereditato dalla home, che la dichiarerebbe copia di un'altra.
    const canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    const ogUrl = document.head.querySelector<HTMLMetaElement>('meta[property="og:url"]');
    if (path) {
      const url = `${SITE_URL}${path}`;
      (canonical ?? aggiungiCanonical()).href = url;
      meta('property', 'og:url').content = url;
    } else {
      canonical?.remove();
      ogUrl?.remove();
    }

    if (robots) meta('name', 'robots').content = robots;
    else document.head.querySelector('meta[name="robots"]')?.remove();
  }, [titolo, descrizione, path, robots]);
}

function aggiungiCanonical(): HTMLLinkElement {
  const link = document.createElement('link');
  link.rel = 'canonical';
  document.head.appendChild(link);
  return link;
}

/**
 * Un blocco di dati strutturati, montato con la pagina e tolto con lei.
 *
 * Serve alla scheda di Google: nome, ruolo e profili non si leggono da un h1
 * che si riscrive da solo, mentre da qui arrivano già in chiaro.
 */
export function useJsonLd(dati: object | null) {
  const serializzato = dati ? JSON.stringify(dati) : null;

  useEffect(() => {
    if (!serializzato) return;
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = serializzato;
    document.head.appendChild(script);
    return () => script.remove();
  }, [serializzato]);
}
