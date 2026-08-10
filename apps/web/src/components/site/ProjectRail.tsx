import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ProjectCard, ProjectCardSkeleton } from './ProjectCard';
import type { Project } from '../../lib/types';

type Props = { projects: Project[]; loading: boolean };

/// Il nastro poggia su uno scorrimento nativo con scroll-snap: swipe, trackpad,
/// rotella, tastiera, barra e semantica di regione scorrevole arrivano dal
/// browser. L'inclinazione è solo una passata di trasformazioni sopra, calcolata
/// da scrollLeft — le trasformazioni non spostano il layout, quindi i punti di
/// aggancio restano dove sono. Con prefers-reduced-motion la passata non gira e
/// resta un nastro piatto perfettamente utilizzabile.
///
/// Numeri della resa: 14° di rotazione e 90px di rientro alla distanza di una
/// card, con esponente 0.7 così crescono meno che linearmente. Oltre i ~20° il
/// testo delle card laterali inizia a non leggersi, che è tutto il punto per cui
/// non è un coverflow.
const TILT_DEG = 14;
const DEPTH_PX = 90;
const FALLOFF = 0.7;
const FADE = 0.18;

export function ProjectRail({ projects, loading }: Props) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const [progress, setProgress] = useState(0);
  // Quanta parte del nastro sta nel viewport: è la larghezza del cursore.
  const [visibleShare, setVisibleShare] = useState(1);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  // Chiavi univoche: con due 'skeleton-small' identici React non riesce a
  // riconciliare la lista e si porta dietro uno scheletro orfano a caricamento finito.
  const skeletons = [
    { key: 'sk-0', size: 'large' as const },
    { key: 'sk-1', size: 'small' as const },
    { key: 'sk-2', size: 'small' as const },
  ];
  const count = loading ? skeletons.length : projects.length;

  const paint = useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const track = viewport.firstElementChild as HTMLElement | null;
    if (!track) return;

    const cards = [...viewport.querySelectorAll<HTMLElement>('[data-rail-card]')];
    if (cards.length === 0) return;

    // I centri si ricavano camminando la riga invece di leggere offsetLeft:
    // quello dipende da quale sia l'offsetParent, che cambia con proprietà
    // apparentemente innocue. Larghezze, gap e padding sono misure di layout,
    // quindi non le tocca la trasformazione che stiamo per scrivere: nessun
    // anello di retroazione.
    const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
    const padLeft = parseFloat(getComputedStyle(viewport).paddingLeft) || 0;

    let x = padLeft;
    const centres = cards.map((card) => {
      const centre = x + card.offsetWidth / 2;
      x += card.offsetWidth + gap;
      return centre;
    });

    const viewportCentre = viewport.scrollLeft + viewport.clientWidth / 2;
    const first = centres[0] ?? 0;
    const last = centres[centres.length - 1] ?? 0;
    // Il passo medio vero, non scrollWidth/n: quello includerebbe lo spazio
    // laterale e gonfierebbe il passo, appiattendo l'effetto.
    const pitch = centres.length > 1 ? (last - first) / (centres.length - 1) : viewport.clientWidth;

    cards.forEach((card, i) => {
      const steps = ((centres[i] ?? 0) - viewportCentre) / (pitch || 1);
      const distance = Math.abs(steps);
      const ramp = Math.pow(distance, FALLOFF);

      card.style.transform =
        `translateZ(${-DEPTH_PX * ramp}px) rotateY(${-TILT_DEG * ramp * Math.sign(steps)}deg)`;
      card.style.opacity = String(Math.max(0.32, 1 - FADE * distance));
    });
  }, []);

  const readScroll = useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const max = viewport.scrollWidth - viewport.clientWidth;
    setProgress(max > 0 ? viewport.scrollLeft / max : 0);
    setVisibleShare(Math.min(1, viewport.clientWidth / Math.max(viewport.scrollWidth, 1)));
    setAtStart(viewport.scrollLeft <= 2);
    setAtEnd(max - viewport.scrollLeft <= 2);
  }, []);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const flat = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const onScroll = () => {
      readScroll();
      if (flat || rafRef.current !== null) return;
      // Una passata per frame: lo scroll emette più eventi di quanti frame ci
      // siano, e ridipingere a ogni evento è lavoro buttato.
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        paint();
      });
    };

    readScroll();
    if (!flat) paint();

    viewport.addEventListener('scroll', onScroll, { passive: true });
    const observer = new ResizeObserver(onScroll);
    observer.observe(viewport);

    return () => {
      viewport.removeEventListener('scroll', onScroll);
      observer.disconnect();
      // Azzerare il ref non è pignoleria: la guardia sopra usa "non nullo" per
      // sapere se c'è già un frame in coda. Annullando il frame senza azzerarlo,
      // il valore resta e da lì in poi ogni scroll esce subito — la passata non
      // gira più e le card restano congelate all'ultima inclinazione dipinta.
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [paint, readScroll, count]);

  // Il cursore non scende sotto il 10%: con molti progetti diventerebbe un puntino.
  const railThumb = Math.max(visibleShare * 100, 10);

  const nudge = (direction: 1 | -1) => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const card = viewport.querySelector<HTMLElement>('[data-rail-card]');
    const step = card ? card.offsetWidth + 24 : viewport.clientWidth * 0.6;
    viewport.scrollBy({ left: step * direction, behavior: 'smooth' });
  };

  return (
    <div className="rail">
      <div className="container rail-head">
        <div className="rail-hint">
          {/* "scorri di lato" vale sia per il trascinamento sia per lo swipe, e
              su schermi stretti non va a capo come "trascina per scorrere". */}
          {loading ? 'Carico i progetti…' : `${projects.length} progetti · scorri di lato`}
        </div>
        <div className="rail-buttons">
          <button
            type="button"
            className="rail-button"
            onClick={() => nudge(-1)}
            disabled={atStart}
            aria-label="Progetti precedenti"
          >
            <ChevronLeft aria-hidden="true" />
          </button>
          <button
            type="button"
            className="rail-button"
            onClick={() => nudge(1)}
            disabled={atEnd}
            aria-label="Progetti successivi"
          >
            <ChevronRight aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* tabIndex: rende la regione raggiungibile da tastiera, dove le frecce
          scorrono già di loro perché è un contenitore scorrevole vero. */}
      <div
        className="rail-viewport"
        ref={viewportRef}
        tabIndex={0}
        role="region"
        aria-label="Progetti, scorrevole in orizzontale"
      >
        <div className="rail-track">
          {loading
            ? skeletons.map((s) => (
                <div className="rail-item" data-rail-card data-size={s.size} key={s.key}>
                  <ProjectCardSkeleton size={s.size} />
                </div>
              ))
            : projects.map((project, i) => (
                <div className="rail-item" data-rail-card data-size={project.size} key={project.id}>
                  <ProjectCard project={project} index={i} inRail />
                </div>
              ))}
        </div>
      </div>

      {/* Il cursore non compare se il nastro sta già tutto nel viewport. */}
      {visibleShare < 0.999 && (
        <div className="container">
          <div className="rail-progress" aria-hidden="true">
            <span
              style={{
                width: `${railThumb}%`,
                left: `${progress * (100 - railThumb)}%`,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
