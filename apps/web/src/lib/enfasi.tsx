import { Fragment, type ReactNode } from 'react';

/**
 * Due soli marcatori dentro i testi delle impostazioni: `_così_` diventa un
 * corsivo, `*così*` un grassetto.
 *
 * Serve a non perdere l'enfasi dei titoli quando il testo passa dal backoffice.
 * L'alternativa sarebbe far scrivere HTML in un campo e stamparlo con
 * dangerouslySetInnerHTML: qui invece quello che arriva dalle impostazioni resta
 * testo, e le uniche due cose che il sito interpreta sono questi segni.
 *
 * Chi scrive dal backoffice non deve saperlo per forza: senza marcatori il testo
 * esce identico a com'è stato scritto.
 */

// Il gruppo è di cattura: split lo tiene nei pezzi invece di buttarlo via.
const MARCATORI = /(_[^_\n]+_|\*[^*\n]+\*)/g;

export function enfasi(testo: string): ReactNode {
  return testo
    .split(MARCATORI)
    .filter(Boolean)
    .map((pezzo, i) => {
      const dentro = pezzo.slice(1, -1);
      if (pezzo.startsWith('_') && pezzo.endsWith('_') && dentro) return <em key={i}>{dentro}</em>;
      if (pezzo.startsWith('*') && pezzo.endsWith('*') && dentro)
        return <strong key={i}>{dentro}</strong>;
      return <Fragment key={i}>{pezzo}</Fragment>;
    });
}
