/**
 * Genera le cover astratte delle card progetto.
 *
 * Una cover per progetto, stessa grammatica visiva (fondo tech noir, griglia
 * sottile, bagliore dell'accento) e un motivo geometrico diverso per categoria.
 *
 * Vincolo di composizione: .project-preview-inner e' alto 150px fissi con
 * object-fit: cover, e la card e' larga fra 280 e 520px meno 64 di padding
 * (--rail-card / --rail-card-wide). Il riquadro e' quindi sempre piu' stretto
 * di 640x220 in proporzione: si ritaglia in orizzontale, mai in verticale.
 * La fascia garantita su ogni card e' x 162..478: il motivo sta li' dentro,
 * il fondo sborda di proposito.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const W = 640;
const H = 220;
const OUT = process.argv[2];
if (!OUT) throw new Error('uso: node make-covers.mjs <directory-di-output>');

const r2 = (n) => Math.round(n * 100) / 100;

/** Fonde due colori esadecimali, t=0 → a, t=1 → b. */
function mix(a, b, t) {
  const p = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const [ar, ag, ab] = p(a);
  const [br, bg, bb] = p(b);
  const c = (x, y) => Math.round(x + (y - x) * t).toString(16).padStart(2, '0');
  return `#${c(ar, br)}${c(ag, bg)}${c(ab, bb)}`;
}

function shell(accent, glow2, motif) {
  const bright = mix(accent, '#ffffff', 0.45);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#0b1220"/>
      <stop offset="1" stop-color="#05070d"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.34" cy="0.1" r="0.78">
      <stop offset="0" stop-color="${accent}" stop-opacity="0.42"/>
      <stop offset="0.55" stop-color="${accent}" stop-opacity="0.09"/>
      <stop offset="1" stop-color="${accent}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="glow2" cx="0.86" cy="1" r="0.62">
      <stop offset="0" stop-color="${glow2}" stop-opacity="0.22"/>
      <stop offset="1" stop-color="${glow2}" stop-opacity="0"/>
    </radialGradient>
    <!-- Alone d'appoggio dei motivi: sfumato, perche' un'ellisse a tinta piatta
         lascia un bordo netto che si legge come un ovale sopra il fondo. -->
    <radialGradient id="soft">
      <stop offset="0" stop-color="${accent}" stop-opacity="0.17"/>
      <stop offset="1" stop-color="${accent}" stop-opacity="0"/>
    </radialGradient>
    <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
      <path d="M32 0H0v32" fill="none" stroke="#ffffff" stroke-opacity="0.05" stroke-width="1"/>
    </pattern>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect width="${W}" height="${H}" fill="url(#grid)"/>
  <rect width="${W}" height="${H}" fill="url(#glow2)"/>
  <rect width="${W}" height="${H}" fill="url(#glow)"/>
${motif(accent, bright)}
</svg>
`;
}

/* ── Gestionale: matrice di moduli percorsa da un'onda diagonale ─────────── */
function matrix(accent, bright) {
  const cols = 22;
  const rows = 6;
  const out = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = 20 + col * 28;
      const y = 39 + row * 26;
      const wave = 0.5 + 0.5 * Math.sin(col * 0.5 - row * 0.55 + 1.2);
      const op = r2(0.05 + 0.5 * wave ** 2.4);
      if (op > 0.4) {
        out.push(
          `  <rect x="${x - 5}" y="${y - 5}" width="21" height="21" rx="7" fill="${accent}" opacity="${r2(op * 0.22)}"/>`,
        );
      }
      const fill = op > 0.46 ? bright : accent;
      out.push(`  <rect x="${x}" y="${y}" width="11" height="11" rx="3" fill="${fill}" opacity="${op}"/>`);
    }
  }
  return out.join('\n');
}

/* ── Mobile: onde che si irradiano da sotto il dispositivo ───────────────── */
function waves(accent, bright) {
  const out = [];
  for (let r = 45; r <= 580; r += 33) {
    const t = r / 580;
    const op = r2(0.02 + 0.3 * (1 - t) ** 1.3);
    const sw = r2(Math.max(0.5, 1.4 - 0.9 * t));
    out.push(
      `  <circle cx="320" cy="268" r="${r}" fill="none" stroke="${accent}" stroke-opacity="${op}" stroke-width="${sw}"/>`,
    );
  }
  out.push('  <g transform="rotate(-14 320 110)">');
  out.push(
    `    <rect x="274" y="40" width="92" height="140" rx="16" fill="#05070d" fill-opacity="0.55" stroke="${accent}" stroke-opacity="0.5" stroke-width="1.2"/>`,
  );
  out.push(
    `    <rect x="284" y="50" width="72" height="120" rx="10" fill="${accent}" fill-opacity="0.05" stroke="${accent}" stroke-opacity="0.16"/>`,
  );
  out.push(`    <rect x="310" y="57" width="20" height="3" rx="1.5" fill="${bright}" opacity="0.5"/>`);
  out.push(`    <rect x="304" y="160" width="32" height="3" rx="1.5" fill="${accent}" opacity="0.35"/>`);
  out.push('  </g>');
  return out.join('\n');
}

/* ── AI agents: costellazione di nodi con un percorso attivo ─────────────── */
function graph(accent, bright) {
  const n = [
    [176, 160], [225, 106], [271, 162], [303, 68], [329, 126],
    [378, 72], [386, 166], [432, 114], [473, 58], [476, 162],
  ];
  const edges = [[0, 1], [1, 2], [1, 4], [2, 4], [3, 1], [3, 4], [4, 5], [4, 6], [5, 7], [6, 7], [7, 8], [7, 9], [3, 5]];
  const active = [[1, 4], [4, 5], [5, 7], [7, 8]].map(([a, b]) => `${a}-${b}`);
  const out = [];

  // Monconi verso il bordo: il grafo continua fuori inquadratura. Restano corti
  // e molto tenui, altrimenti una diagonale lunga legge come linea di grafico.
  for (const [i, x, y] of [[0, 118, 196], [8, 546, 20], [9, 548, 196]]) {
    out.push(
      `  <path d="M${n[i][0]} ${n[i][1]}L${x} ${y}" stroke="${accent}" stroke-opacity="0.14" stroke-width="1" stroke-dasharray="5 5"/>`,
    );
  }
  for (const [a, b] of edges) {
    const on = active.includes(`${a}-${b}`);
    out.push(
      `  <path d="M${n[a][0]} ${n[a][1]}L${n[b][0]} ${n[b][1]}" stroke="${on ? bright : accent}" stroke-opacity="${on ? 0.55 : 0.2}" stroke-width="${on ? 1.4 : 1}"/>`,
    );
  }
  n.forEach(([x, y], i) => {
    const hub = i === 4;
    const on = hub || [1, 5, 7, 8].includes(i);
    if (on) {
      out.push(
        `  <circle cx="${x}" cy="${y}" r="${hub ? 13 : 9}" fill="none" stroke="${accent}" stroke-opacity="0.22"/>`,
      );
      out.push(`  <circle cx="${x}" cy="${y}" r="${hub ? 18 : 13}" fill="${accent}" opacity="0.07"/>`);
    }
    out.push(
      `  <circle cx="${x}" cy="${y}" r="${hub ? 6 : 3.5}" fill="${on ? bright : accent}" opacity="${on ? 0.95 : 0.55}"/>`,
    );
  });
  return out.join('\n');
}

/* ── Libreria CRUD: moduli isometrici impilati ───────────────────────────── */
function layers(accent, bright) {
  const cx = 320;
  const hw = 132;
  const hh = 32;
  const gap = 19;
  const ys = [88, 107, 126, 145];
  const diamond = (y, w, h) => `M${cx} ${r2(y - h)}L${cx + w} ${y}L${cx} ${r2(y + h)}L${cx - w} ${y}Z`;
  const out = [];

  out.push(`  <ellipse cx="${cx}" cy="182" rx="150" ry="22" fill="url(#soft)"/>`);
  ys.slice(0, -1).forEach((y) => {
    for (const x of [cx - hw, cx + hw]) {
      out.push(`  <path d="M${x} ${y}L${x} ${y + gap}" stroke="${accent}" stroke-opacity="0.16" stroke-width="1"/>`);
    }
  });
  ys.forEach((y, i) => {
    out.push(
      `  <path d="${diamond(y, hw, hh)}" fill="${accent}" fill-opacity="${r2(0.03 + i * 0.022)}" stroke="${accent}" stroke-opacity="${r2(0.16 + i * 0.13)}" stroke-width="1.1"/>`,
    );
    if (i === 3) {
      for (const [x, y2] of [[cx, y - hh], [cx + hw, y], [cx, y + hh], [cx - hw, y]]) {
        out.push(`  <circle cx="${x}" cy="${y2}" r="2.6" fill="${bright}" opacity="0.7"/>`);
      }
    }
  });
  // Il modulo che sta per incastrarsi: e' cio' che rende la pila "componibile".
  out.push(
    `  <path d="${diamond(42, 38, 9)}" fill="${bright}" fill-opacity="0.1" stroke="${bright}" stroke-opacity="0.6" stroke-width="1.1"/>`,
  );
  return out.join('\n');
}

/* ── Quant lab: candele astratte attraversate da un segnale ─────────────── */
function candles(accent, bright) {
  const out = [];
  const n = 17;
  const x0 = 168;
  const step = 19;
  // Somma di seni al posto di un random: il disegno resta identico a ogni
  // rigenerazione, senza dover portarsi dietro un seme.
  const v = (i) =>
    Math.min(0.94, Math.max(0.06, 0.5 + 0.3 * Math.sin(i * 0.55) + 0.16 * Math.sin(i * 1.31 + 1.1) + 0.08 * Math.sin(i * 2.6 + 0.4)));

  out.push(`  <ellipse cx="320" cy="110" rx="200" ry="78" fill="url(#soft)"/>`);
  for (let i = 0; i < n; i++) {
    const x = x0 + i * step;
    const cy = r2(180 - v(i) * 140);
    const h = r2(14 + 18 * Math.abs(Math.sin(i * 0.9 + 0.3)));
    const up = i > 0 && v(i) > v(i - 1);
    const op = r2(0.22 + 0.4 * (1 - Math.abs(i - (n - 1) / 2) / ((n - 1) / 2)));
    out.push(
      `  <path d="M${x} ${r2(cy - h / 2 - 12)}L${x} ${r2(cy + h / 2 + 12)}" stroke="${accent}" stroke-opacity="${r2(op * 0.7)}" stroke-width="1"/>`,
    );
    out.push(
      up
        ? `  <rect x="${x - 3}" y="${r2(cy - h / 2)}" width="6" height="${h}" rx="2" fill="${bright}" opacity="${op}"/>`
        : `  <rect x="${x - 2.5}" y="${r2(cy - h / 2)}" width="5" height="${h}" rx="2" fill="none" stroke="${accent}" stroke-opacity="${r2(op + 0.15)}" stroke-width="1.2"/>`,
    );
  }
  const pts = [];
  for (let x = 40; x <= 600; x += 8) pts.push(`${x} ${r2(112 - 40 * Math.sin(x * 0.0135 + 0.6))}`);
  out.push(
    `  <path d="M${pts.join('L')}" fill="none" stroke="${bright}" stroke-opacity="0.5" stroke-width="1.6" stroke-linecap="round"/>`,
  );
  return out.join('\n');
}

/* ── Sito personale: i pannelli del nastro, inclinati ────────────────────── */
function panels(accent, bright) {
  const out = [];
  out.push('  <g transform="translate(320 110) skewY(-7) translate(-320 -110)">');
  [170, 294, 418].forEach((x, i) => {
    const mid = i === 1;
    out.push(
      `    <rect x="${x}" y="52" width="112" height="116" rx="14" fill="${accent}" fill-opacity="${mid ? 0.12 : 0.05}" stroke="${mid ? bright : accent}" stroke-opacity="${mid ? 0.7 : 0.34}" stroke-width="1.2"/>`,
    );
    out.push(
      `    <rect x="${x + 16}" y="${mid ? 132 : 136}" width="${mid ? 52 : 38}" height="4" rx="2" fill="${mid ? bright : accent}" opacity="${mid ? 0.7 : 0.3}"/>`,
    );
  });
  out.push('  </g>');
  // Eco della .rail-progress sotto le card, con il tratto attivo al centro.
  out.push(`  <rect x="120" y="192" width="400" height="3" rx="1.5" fill="${accent}" opacity="0.14"/>`);
  out.push(`  <rect x="252" y="192" width="136" height="3" rx="1.5" fill="${bright}" opacity="0.6"/>`);
  return out.join('\n');
}

/* I file prendono il nome dallo slug del progetto: il legame con imageUrl deve
   restare leggibile. I motivi non usati qui (waves, graph) restano disponibili
   per i progetti che verranno. */
const covers = [
  { file: 'sito-personale.svg', accent: '#7c5cff', glow2: '#22c3e6', motif: panels },
  { file: 'crud-lib.svg', accent: '#4ea1ff', glow2: '#22c3e6', motif: layers },
  { file: 'gestionale-ore.svg', accent: '#00c0af', glow2: '#7c5cff', motif: matrix },
  { file: 'tradingview-quant-lab.svg', accent: '#ff7a59', glow2: '#7c5cff', motif: candles },
];

mkdirSync(OUT, { recursive: true });
for (const c of covers) {
  writeFileSync(path.join(OUT, c.file), shell(c.accent, c.glow2, c.motif));
  console.log('scritto', path.join(OUT, c.file));
}
