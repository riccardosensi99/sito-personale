/**
 * La stanza in prospettiva dietro al titolo: cornici concentriche che corrono
 * verso un punto di fuga, più i raggi che ne collegano gli angoli.
 *
 * Le cornici sono ferme nel markup e si muovono via CSS, ognuna con un ritardo
 * negativo diverso sulla stessa animazione: il ciclo è già a regime al primo
 * frame, senza la sfilata iniziale che tradirebbe l'inizio del loop.
 */

const FRAMES = 7;
/** Rapporto fra una cornice e la successiva verso il fondo. */
const STEP = 0.72;
const CYCLE_S = 14;

export function PerspectiveRoom() {
  const frames = Array.from({ length: FRAMES }, (_, i) => {
    const scale = STEP ** i;
    return {
      scale,
      // Il ritardo negativo distribuisce le cornici lungo il ciclo: la i-esima
      // parte già a i/FRAMES del percorso.
      delay: -(CYCLE_S / FRAMES) * i,
    };
  });

  return (
    <div className="lab-room" aria-hidden="true">
      <div className="lab-room-stage">
        {frames.map(({ scale, delay }) => (
          <span
            key={scale}
            className="lab-room-frame"
            style={{ '--frame-scale': scale, animationDelay: `${delay}s` } as React.CSSProperties}
          />
        ))}
        {/* I raggi partono dagli angoli e convergono: sono ciò che dà la
            profondità, le sole cornici leggerebbero come rettangoli piatti. */}
        <svg className="lab-room-rays" viewBox="0 0 100 100" preserveAspectRatio="none">
          <path d="M0 0L50 50M100 0L50 50M0 100L50 50M100 100L50 50" />
        </svg>
      </div>
    </div>
  );
}
