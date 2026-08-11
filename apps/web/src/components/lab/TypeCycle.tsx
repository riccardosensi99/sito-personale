import { useEffect, useState } from 'react';

/**
 * Titolo che si riscrive da solo: scrive un ruolo, si ferma, lo cancella e passa
 * al successivo, con il cursore che lampeggia in coda.
 *
 * Un solo timeout per volta, riarmato a ogni passo: un intervallo fisso non
 * saprebbe distinguere la pausa a parola finita dalla velocità di battuta, che
 * sono i due tempi che rendono credibile la scrittura.
 */

const TYPE_MS = 78;
const ERASE_MS = 38;
const HOLD_MS = 1500;
const BLANK_MS = 380;

type Props = { words: string[] };

export function TypeCycle({ words }: Props) {
  const [index, setIndex] = useState(0);
  const [len, setLen] = useState(0);
  const [erasing, setErasing] = useState(false);

  const word = words[index] ?? '';

  useEffect(() => {
    if (words.length === 0) return;

    // Con prefers-reduced-motion la parola resta ferma: l'effetto è tutto nel
    // movimento, e senza movimento il testo deve solo essere leggibile.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setLen(word.length);
      return;
    }

    let delay: number;
    if (!erasing && len < word.length) delay = TYPE_MS;
    else if (!erasing) delay = HOLD_MS;
    else if (len > 0) delay = ERASE_MS;
    else delay = BLANK_MS;

    const t = window.setTimeout(() => {
      if (!erasing && len < word.length) setLen(len + 1);
      else if (!erasing) setErasing(true);
      else if (len > 0) setLen(len - 1);
      else {
        setErasing(false);
        setIndex((i) => (i + 1) % words.length);
      }
    }, delay);

    return () => window.clearTimeout(t);
  }, [len, erasing, word, words.length]);

  return (
    <span className="lab-type">
      {/* Per chi legge con uno screen reader l'elenco completo, una volta sola:
          un aria-live sul testo animato lo farebbe annunciare a ogni lettera. */}
      <span className="sr-only">{words.join(', ')}</span>
      <span className="lab-type-text" aria-hidden="true">
        {word.slice(0, len)}
        <i className="lab-type-caret" />
      </span>
    </span>
  );
}
