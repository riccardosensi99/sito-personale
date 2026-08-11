import { useEffect } from 'react';

/**
 * Fa uscire di scena la copertina d'apertura.
 *
 * La copertina non si monta qui: è HTML statico dentro index.html, insieme al
 * suo foglio di stile in linea, perché deve poter essere dipinta prima che
 * arrivi il bundle — è quello che sta coprendo. Qui si decide soltanto quando
 * toglierla, e il come lo sa già lo script che sta accanto al markup.
 *
 * Non è un finto caricamento: se ne va appena i contenuti ci sono. Con un
 * minimo, perché un lampo di duecento millisecondi si legge come un difetto, e
 * con un tetto, perché un'API che non risponde non deve tenere in ostaggio chi
 * è appena arrivato.
 */

/// Quanto resta come minimo da quando si è vista, e quanto al massimo se i
/// contenuti non arrivano.
const MINIMA = 850;
const MASSIMA = 2000;

/**
 * Da quando è sullo schermo.
 *
 * La copertina è il primo contenuto dipinto della pagina, quindi il momento in
 * cui è comparsa è esattamente first-contentful-paint. Contare da qui e non da
 * quando React si è montato è ciò che la fa sparire subito su una rete lenta:
 * lì, quando questo codice gira, si è già vista per tre secondi buoni.
 */
function vistaDa(): number {
  const fcp = performance.getEntriesByName('first-contentful-paint')[0];
  return fcp ? fcp.startTime : performance.now();
}

export function useOpening(pronto: boolean) {
  useEffect(() => {
    const chiudi = window.__chiudiCopertina;
    // Non c'è su /cookie, nel backoffice e in chi arriva su un'ancora: sono i
    // casi in cui lo script in index.html l'ha tolta prima ancora di dipingerla.
    if (!chiudi) return;

    const attesa = Math.max(0, (pronto ? MINIMA : MASSIMA) - (performance.now() - vistaDa()));
    const t = window.setTimeout(chiudi, attesa);
    return () => window.clearTimeout(t);
  }, [pronto]);
}
