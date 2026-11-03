// Pagina di manutenzione servita da Cloudflare quando il server non risponde.
//
// Il sito passa da un Cloudflare Tunnel: se si ferma cloudflared, o l'intera
// macchina, Cloudflare risponde con la sua pagina di errore (1033, status 530)
// e sul server non c'è più niente che possa farlo meglio. Questo Worker sta
// davanti al sito, sull'edge: inoltra ogni richiesta all'origine così com'è e,
// solo se l'origine è irraggiungibile, al posto dell'errore mostra
// maintenance.html.
//
// Sostituisce la risposta solo per le pagine (richieste che accettano HTML):
// a fetch, immagini e chiamate /api arriva l'errore originale, che è quello che
// il codice si aspetta di gestire.

import page from './maintenance.html';
import logo from '../../apps/web/public/logo-mark.webp';

const LOGO_PATH = '/__manutenzione/logo.webp';

// 502/504 li dà Cloudflare quando cloudflared c'è ma nginx no; i 52x sono
// i suoi errori di connessione all'origine; 530 accompagna i 1033 del tunnel.
// 503 resta fuori di proposito: può mandarlo l'applicazione e ha un senso suo.
const ORIGIN_DOWN = new Set([502, 504, 520, 521, 522, 523, 524, 525, 526, 527, 530]);

export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (url.pathname === LOGO_PATH) {
      return new Response(logo, {
        headers: {
          'content-type': 'image/webp',
          'cache-control': 'public, max-age=86400',
        },
      });
    }

    let response;
    try {
      response = await fetch(request);
    } catch {
      return wantsHtml(request) ? maintenance() : new Response(null, { status: 502 });
    }

    if (ORIGIN_DOWN.has(response.status) && wantsHtml(request)) {
      return maintenance();
    }
    return response;
  },
};

function wantsHtml(request) {
  return request.method === 'GET' && (request.headers.get('accept') ?? '').includes('text/html');
}

function maintenance() {
  return new Response(page, {
    // 503 + Retry-After: i motori di ricerca capiscono che è temporaneo e non
    // tolgono le pagine dall'indice.
    status: 503,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-store',
      'retry-after': '300',
      'x-robots-tag': 'noindex',
    },
  });
}
