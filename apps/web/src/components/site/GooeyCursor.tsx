import { useEffect, useRef } from 'react';

/**
 * Cursore a blob liquido.
 *
 * Una testa che insegue il puntatore e una coda di blob che inseguono ognuno il
 * precedente, tutti dentro un filtro SVG che ne fonde i bordi: quando sono
 * vicini formano una massa sola, quando il mouse corre la coda si allunga e si
 * spezza in gocce.
 *
 * Le posizioni si scrivono direttamente sul DOM dentro un rAF: passarle per lo
 * stato di React vorrebbe dire un render a ogni frame per una cosa che non
 * cambia una riga di markup.
 */

/** Quanto ogni blob recupera per frame verso il suo bersaglio, dalla testa in giù. */
const EASE = [0.22, 0.16, 0.13, 0.1, 0.08, 0.065];
const SIZES = [30, 26, 22, 18, 15, 12];

/**
 * Serve un puntatore fine da inseguire. La query è any-pointer e non pointer:
 * su un portatile touch il dispositivo primario è grossolano anche quando c'è
 * un mouse collegato, e con `pointer` il cursore finto non partirebbe.
 * Deve restare identica a quella che in site.css nasconde il cursore di sistema,
 * o si finisce senza nessuno dei due.
 */
const FINE_POINTER = '(any-pointer: fine)';
const CALM = '(prefers-reduced-motion: reduce)';

export function GooeyCursor() {
  const layer = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!window.matchMedia(FINE_POINTER).matches) return;

    const root = layer.current;
    if (!root) return;

    const blobs = Array.from(root.querySelectorAll<HTMLElement>('.site-blob'));
    if (blobs.length === 0) return;

    // Con prefers-reduced-motion resta la sola testa, agganciata al puntatore:
    // il cursore serve ancora a vedere dove si è, ma non insegue né ondeggia.
    const calm = window.matchMedia(CALM).matches;

    const target = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const pos = blobs.map(() => ({ ...target }));
    let hovering = false;
    let frame = 0;

    const onMove = (e: PointerEvent) => {
      target.x = e.clientX;
      target.y = e.clientY;

      // Il bersaglio sotto il puntatore decide la forma: sopra un elemento
      // interattivo la testa si apre in anello, altrove resta piena.
      const el = e.target as Element | null;
      const over = Boolean(el?.closest('a, button, [data-cursor="on"]'));
      if (over !== hovering) {
        hovering = over;
        root.classList.toggle('is-hovering', over);
      }
    };

    const onLeave = () => root.classList.add('is-out');
    const onEnter = () => root.classList.remove('is-out');

    const tick = () => {
      let leadX = target.x;
      let leadY = target.y;

      pos.forEach((p, i) => {
        const ease = calm ? 1 : (EASE[i] ?? 0.08);
        p.x += (leadX - p.x) * ease;
        p.y += (leadY - p.y) * ease;
        leadX = p.x;
        leadY = p.y;

        const blob = blobs[i];
        if (blob) blob.style.transform = `translate3d(${p.x}px, ${p.y}px, 0) translate(-50%, -50%)`;

        // L'anello sta fuori dal filtro e non può essere spostato da qui senza
        // sovrascriverne la scala: la posizione passa da due variabili, la
        // scala resta al CSS che la anima.
        if (i === 0) {
          root.style.setProperty('--cx', `${p.x}px`);
          root.style.setProperty('--cy', `${p.y}px`);
        }
      });

      frame = requestAnimationFrame(tick);
    };

    root.classList.add('is-live');
    window.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('pointerleave', onLeave);
    document.addEventListener('pointerenter', onEnter);
    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerleave', onLeave);
      document.removeEventListener('pointerenter', onEnter);
      root.classList.remove('is-live');
    };
  }, []);

  return (
    <div className="site-cursor" ref={layer} aria-hidden="true">
      {/* Il filtro sfoca e poi ritaglia l'alpha: le forme vicine si saldano,
          quelle lontane restano gocce separate. */}
      <svg className="site-cursor-defs" width="0" height="0">
        <defs>
          <filter id="site-goo">
            <feGaussianBlur in="SourceGraphic" stdDeviation="7" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -10"
            />
          </filter>
        </defs>
      </svg>

      <div className="site-cursor-goo">
        {SIZES.map((size, i) => (
          <span
            key={size}
            className={`site-blob${i === 0 ? ' site-blob--head' : ''}`}
            style={{ width: size, height: size }}
          />
        ))}
      </div>

      {/* Fuori dal filtro apposta: dentro, la sfocatura piu' la soglia sull'alpha
          chiuderebbero il buco dell'anello e ne farebbero un disco pieno. */}
      <span className="site-ring" />
    </div>
  );
}
