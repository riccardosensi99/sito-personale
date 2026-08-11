/**
 * Nastro diagonale che scorre in fondo alla scena.
 *
 * Il contenuto è duplicato e l'animazione trasla di esattamente metà larghezza:
 * quando la prima copia esce, la seconda è nel punto in cui la prima era
 * partita, e il salto non si vede. Con una copia sola resterebbe un vuoto.
 */

type Props = {
  items: string[];
  /** Secondi per un giro intero. Più alto, più lento. */
  duration?: number;
  /** Inverte il verso, per far incrociare due nastri. */
  reverse?: boolean;
  /** Gradi di inclinazione del nastro. */
  tilt?: number;
};

export function Marquee({ items, duration = 26, reverse = false, tilt = -3 }: Props) {
  const run = [...items, ...items];

  return (
    <div className={`site-marquee${reverse ? ' site-marquee--reverse' : ''}`} style={{ '--tilt': `${tilt}deg` } as React.CSSProperties} aria-hidden="true">
      <div className="site-marquee-track" style={{ animationDuration: `${duration}s` }}>
        {run.map((item, i) => (
          <span className="site-marquee-item" key={`${item}-${i}`}>
            {item}
            <i className="site-marquee-star" />
          </span>
        ))}
      </div>
    </div>
  );
}
