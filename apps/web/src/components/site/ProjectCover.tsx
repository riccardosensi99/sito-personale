import { useId, type CSSProperties, type ReactNode } from 'react';

/**
 * Cover astratta disegnata a runtime per i progetti senza screenshot.
 *
 * Il motivo si sceglie dallo slug, quindi un progetto ha sempre la stessa
 * cover, e il colore arriva da --project-accent, che ProjectCard imposta
 * sull'article: un progetto importato da GitHub ha la sua immagine al primo
 * render, senza file da generare né imageUrl da compilare.
 *
 * Il colore passa per `color` e `currentColor` invece che per var() diretta:
 * gli attributi di presentazione SVG (fill, stroke, stop-color) non risolvono
 * var(), mentre currentColor sì. Gli elementi in evidenza stanno dentro un <g>
 * che ridefinisce `color`, ed ereditano così la variante chiara.
 */

const VIEW_W = 640;
const VIEW_H = 220;

const ACCENT = 'var(--project-accent, #22c3e6)';
const BRIGHT: CSSProperties = { color: `color-mix(in srgb, ${ACCENT} 55%, #fff)` };

/** Alone freddo fisso in basso a destra: dà profondità a qualsiasi accento. */
const DEPTH = '#7c5cff';

const r2 = (n: number) => Math.round(n * 100) / 100;

type Ids = { soft: string };

/* ── Matrice di moduli percorsa da un'onda diagonale ─────────────────────── */
function matrix() {
  const halo: ReactNode[] = [];
  const base: ReactNode[] = [];
  const lit: ReactNode[] = [];

  for (let row = 0; row < 6; row++) {
    for (let col = 0; col < 22; col++) {
      const x = 20 + col * 28;
      const y = 39 + row * 26;
      const wave = 0.5 + 0.5 * Math.sin(col * 0.5 - row * 0.55 + 1.2);
      const op = r2(0.05 + 0.5 * wave ** 2.4);
      const key = `${row}-${col}`;

      if (op > 0.4) {
        halo.push(
          <rect key={key} x={x - 5} y={y - 5} width={21} height={21} rx={7} fill="currentColor" opacity={r2(op * 0.22)} />,
        );
      }
      const cell = <rect key={key} x={x} y={y} width={11} height={11} rx={3} fill="currentColor" opacity={op} />;
      (op > 0.46 ? lit : base).push(cell);
    }
  }
  return (
    <>
      {halo}
      {base}
      <g style={BRIGHT}>{lit}</g>
    </>
  );
}

/* ── Onde che si irradiano da sotto un dispositivo inclinato ─────────────── */
function waves() {
  const arcs: ReactNode[] = [];
  for (let r = 45; r <= 580; r += 33) {
    const t = r / 580;
    arcs.push(
      <circle
        key={r}
        cx={320}
        cy={268}
        r={r}
        fill="none"
        stroke="currentColor"
        strokeOpacity={r2(0.02 + 0.3 * (1 - t) ** 1.3)}
        strokeWidth={r2(Math.max(0.5, 1.4 - 0.9 * t))}
      />,
    );
  }
  return (
    <>
      {arcs}
      <g transform="rotate(-14 320 110)">
        <rect x={274} y={40} width={92} height={140} rx={16} fill="#05070d" fillOpacity={0.55} stroke="currentColor" strokeOpacity={0.5} strokeWidth={1.2} />
        <rect x={284} y={50} width={72} height={120} rx={10} fill="currentColor" fillOpacity={0.05} stroke="currentColor" strokeOpacity={0.16} />
        <rect x={304} y={160} width={32} height={3} rx={1.5} fill="currentColor" opacity={0.35} />
        <g style={BRIGHT}>
          <rect x={310} y={57} width={20} height={3} rx={1.5} fill="currentColor" opacity={0.5} />
        </g>
      </g>
    </>
  );
}

/* ── Costellazione di nodi con un percorso attivo ────────────────────────── */
const NODES: [number, number][] = [
  [176, 160], [225, 106], [271, 162], [303, 68], [329, 126],
  [378, 72], [386, 166], [432, 114], [473, 58], [476, 162],
];
const EDGES: [number, number][] = [
  [0, 1], [1, 2], [1, 4], [2, 4], [3, 1], [3, 4], [4, 5], [4, 6], [5, 7], [6, 7], [7, 8], [7, 9], [3, 5],
];
const ACTIVE_EDGES = new Set(['1-4', '4-5', '5-7', '7-8']);
const ACTIVE_NODES = new Set([1, 4, 5, 7, 8]);

/** Lettura totale: gli indici qui sono costanti, ma il tipo non lo sa. */
const node = (i: number): [number, number] => NODES[i] ?? [0, 0];

function graph() {
  const dim: ReactNode[] = [];
  const lit: ReactNode[] = [];

  // Monconi verso il bordo: il grafo continua fuori inquadratura. Restano corti
  // e tenui, altrimenti una diagonale lunga legge come linea di grafico.
  ([[0, 118, 196], [8, 546, 20], [9, 548, 196]] as [number, number, number][]).forEach(([i, x, y]) => {
    dim.push(
      <path key={`stub-${i}`} d={`M${node(i)[0]} ${node(i)[1]}L${x} ${y}`} stroke="currentColor" strokeOpacity={0.14} strokeWidth={1} strokeDasharray="5 5" />,
    );
  });

  EDGES.forEach(([a, b]) => {
    const on = ACTIVE_EDGES.has(`${a}-${b}`);
    const edge = (
      <path
        key={`e-${a}-${b}`}
        d={`M${node(a)[0]} ${node(a)[1]}L${node(b)[0]} ${node(b)[1]}`}
        stroke="currentColor"
        strokeOpacity={on ? 0.55 : 0.2}
        strokeWidth={on ? 1.4 : 1}
      />
    );
    (on ? lit : dim).push(edge);
  });

  NODES.forEach(([x, y], i) => {
    const hub = i === 4;
    const on = ACTIVE_NODES.has(i);
    if (on) {
      dim.push(<circle key={`ring-${i}`} cx={x} cy={y} r={hub ? 13 : 9} fill="none" stroke="currentColor" strokeOpacity={0.22} />);
      dim.push(<circle key={`halo-${i}`} cx={x} cy={y} r={hub ? 18 : 13} fill="currentColor" opacity={0.07} />);
    }
    const dot = <circle key={`n-${i}`} cx={x} cy={y} r={hub ? 6 : 3.5} fill="currentColor" opacity={on ? 0.95 : 0.55} />;
    (on ? lit : dim).push(dot);
  });

  return (
    <>
      {dim}
      <g style={BRIGHT}>{lit}</g>
    </>
  );
}

/* ── Moduli isometrici impilati ──────────────────────────────────────────── */
function layers({ soft }: Ids) {
  const cx = 320;
  const hw = 132;
  const hh = 32;
  const gap = 19;
  const ys: [number, number, number, number] = [88, 107, 126, 145];
  const base = ys[3];
  const diamond = (y: number, w: number, h: number) =>
    `M${cx} ${r2(y - h)}L${cx + w} ${y}L${cx} ${r2(y + h)}L${cx - w} ${y}Z`;

  return (
    <>
      <ellipse cx={cx} cy={182} rx={150} ry={22} fill={`url(#${soft})`} />
      {ys.slice(0, -1).flatMap((y, i) =>
        [cx - hw, cx + hw].map((x) => (
          <path key={`c-${i}-${x}`} d={`M${x} ${y}L${x} ${y + gap}`} stroke="currentColor" strokeOpacity={0.16} strokeWidth={1} />
        )),
      )}
      {ys.map((y, i) => (
        <path
          key={`d-${i}`}
          d={diamond(y, hw, hh)}
          fill="currentColor"
          fillOpacity={r2(0.03 + i * 0.022)}
          stroke="currentColor"
          strokeOpacity={r2(0.16 + i * 0.13)}
          strokeWidth={1.1}
        />
      ))}
      <g style={BRIGHT}>
        {([[cx, base - hh], [cx + hw, base], [cx, base + hh], [cx - hw, base]] as [number, number][]).map(([x, y]) => (
          <circle key={`v-${x}-${y}`} cx={x} cy={y} r={2.6} fill="currentColor" opacity={0.7} />
        ))}
        {/* Il modulo che sta per incastrarsi: rende la pila "componibile". */}
        <path d={diamond(42, 38, 9)} fill="currentColor" fillOpacity={0.1} stroke="currentColor" strokeOpacity={0.6} strokeWidth={1.1} />
      </g>
    </>
  );
}

/* ── Candele astratte attraversate da un segnale ─────────────────────────── */
function candles({ soft }: Ids) {
  const n = 17;
  // Somma di seni al posto di un random: il disegno resta identico a ogni
  // render, senza doversi portare dietro un seme.
  const v = (i: number) =>
    Math.min(0.94, Math.max(0.06, 0.5 + 0.3 * Math.sin(i * 0.55) + 0.16 * Math.sin(i * 1.31 + 1.1) + 0.08 * Math.sin(i * 2.6 + 0.4)));

  const dim: ReactNode[] = [];
  const lit: ReactNode[] = [];

  for (let i = 0; i < n; i++) {
    const x = 168 + i * 19;
    const cy = r2(180 - v(i) * 140);
    const h = r2(14 + 18 * Math.abs(Math.sin(i * 0.9 + 0.3)));
    const op = r2(0.22 + 0.4 * (1 - Math.abs(i - (n - 1) / 2) / ((n - 1) / 2)));

    dim.push(
      <path key={`w-${i}`} d={`M${x} ${r2(cy - h / 2 - 12)}L${x} ${r2(cy + h / 2 + 12)}`} stroke="currentColor" strokeOpacity={r2(op * 0.7)} strokeWidth={1} />,
    );
    if (i > 0 && v(i) > v(i - 1)) {
      lit.push(<rect key={`b-${i}`} x={x - 3} y={r2(cy - h / 2)} width={6} height={h} rx={2} fill="currentColor" opacity={op} />);
    } else {
      dim.push(
        <rect key={`b-${i}`} x={x - 2.5} y={r2(cy - h / 2)} width={5} height={h} rx={2} fill="none" stroke="currentColor" strokeOpacity={r2(op + 0.15)} strokeWidth={1.2} />,
      );
    }
  }

  const pts: string[] = [];
  for (let x = 40; x <= 600; x += 8) pts.push(`${x} ${r2(112 - 40 * Math.sin(x * 0.0135 + 0.6))}`);

  return (
    <>
      <ellipse cx={320} cy={110} rx={200} ry={78} fill={`url(#${soft})`} />
      {dim}
      <g style={BRIGHT}>
        {lit}
        <path d={`M${pts.join('L')}`} fill="none" stroke="currentColor" strokeOpacity={0.5} strokeWidth={1.6} strokeLinecap="round" />
      </g>
    </>
  );
}

/* ── I pannelli del nastro, inclinati ────────────────────────────────────── */
function panels() {
  return (
    <>
      <g transform="translate(320 110) skewY(-7) translate(-320 -110)">
        {[170, 294, 418].map((x, i) => {
          const mid = i === 1;
          return (
            <g key={x}>
              <rect x={x} y={52} width={112} height={116} rx={14} fill="currentColor" fillOpacity={mid ? 0.12 : 0.05} />
              <g style={mid ? BRIGHT : undefined}>
                <rect x={x} y={52} width={112} height={116} rx={14} fill="none" stroke="currentColor" strokeOpacity={mid ? 0.7 : 0.34} strokeWidth={1.2} />
                <rect x={x + 16} y={mid ? 132 : 136} width={mid ? 52 : 38} height={4} rx={2} fill="currentColor" opacity={mid ? 0.7 : 0.3} />
              </g>
            </g>
          );
        })}
      </g>
      {/* Eco della .rail-progress sotto le card, col tratto attivo al centro. */}
      <rect x={120} y={192} width={400} height={3} rx={1.5} fill="currentColor" opacity={0.14} />
      <g style={BRIGHT}>
        <rect x={252} y={192} width={136} height={3} rx={1.5} fill="currentColor" opacity={0.6} />
      </g>
    </>
  );
}

type Motif = (ids: Ids) => ReactNode;

const MOTIFS: Motif[] = [matrix, waves, graph, layers, candles, panels];

/**
 * Motivo scelto a mano, dove dice qualcosa del progetto: i pannelli del nastro
 * per il sito, gli strati per una libreria modulare, le candele per il quant
 * lab. L'hash sotto non ha alcun legame col contenuto e su pochi progetti
 * ripete: con sei motivi e quattro progetti la collisione è più probabile che
 * no. Qui si mette solo ciò che merita, il resto lo decide l'hash.
 */
const PINNED: Record<string, Motif> = {
  'sito-personale': panels,
  'crud-lib': layers,
  'gestionale-ore': matrix,
  'tradingview-quant-lab': candles,
};

/** Stessa cover per lo stesso slug, a ogni render e su ogni macchina. */
function pickMotif(slug: string) {
  const pinned = PINNED[slug];
  if (pinned) return pinned;

  let h = 0;
  for (let i = 0; i < slug.length; i += 1) h = (h * 31 + slug.charCodeAt(i)) >>> 0;
  return MOTIFS[h % MOTIFS.length] ?? matrix;
}

export function ProjectCover({ slug }: { slug: string }) {
  // Gli id dei gradienti vivono nel documento, non nell'SVG: senza un suffisso
  // per istanza la seconda card riuserebbe le definizioni della prima.
  const uid = useId().replace(/:/g, '');
  const ids = { bg: `cbg-${uid}`, glow: `cgl-${uid}`, depth: `cdp-${uid}`, grid: `cgr-${uid}`, soft: `csf-${uid}` };
  const motif = pickMotif(slug);

  return (
    <svg
      className="project-cover"
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      preserveAspectRatio="xMidYMid slice"
      style={{ color: ACCENT }}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={ids.bg} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#0b1220" />
          <stop offset="1" stopColor="#05070d" />
        </linearGradient>
        {/* Nei gradienti il colore passa da style e non da attributo: currentColor
            non risolve in stop-color, e var() negli attributi di presentazione
            non è supportata. Inline style regge entrambi. */}
        <radialGradient id={ids.glow} cx="0.34" cy="0.1" r="0.78">
          <stop offset="0" style={{ stopColor: ACCENT }} stopOpacity={0.42} />
          <stop offset="0.55" style={{ stopColor: ACCENT }} stopOpacity={0.09} />
          <stop offset="1" style={{ stopColor: ACCENT }} stopOpacity={0} />
        </radialGradient>
        <radialGradient id={ids.depth} cx="0.86" cy="1" r="0.62">
          <stop offset="0" stopColor={DEPTH} stopOpacity={0.22} />
          <stop offset="1" stopColor={DEPTH} stopOpacity={0} />
        </radialGradient>
        {/* Alone d'appoggio dei motivi: sfumato, perché un'ellisse a tinta piatta
            lascia un bordo netto che si legge come un ovale sopra il fondo. */}
        <radialGradient id={ids.soft}>
          <stop offset="0" style={{ stopColor: ACCENT }} stopOpacity={0.17} />
          <stop offset="1" style={{ stopColor: ACCENT }} stopOpacity={0} />
        </radialGradient>
        <pattern id={ids.grid} width={32} height={32} patternUnits="userSpaceOnUse">
          <path d="M32 0H0v32" fill="none" stroke="#ffffff" strokeOpacity={0.05} strokeWidth={1} />
        </pattern>
      </defs>

      <rect width={VIEW_W} height={VIEW_H} fill={`url(#${ids.bg})`} />
      <rect width={VIEW_W} height={VIEW_H} fill={`url(#${ids.grid})`} />
      <rect width={VIEW_W} height={VIEW_H} fill={`url(#${ids.depth})`} />
      <rect width={VIEW_W} height={VIEW_H} fill={`url(#${ids.glow})`} />
      {motif(ids)}
    </svg>
  );
}
