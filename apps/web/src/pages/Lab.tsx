import { useEffect, useRef } from 'react';
import { ArrowUpRight, Briefcase, Home as HomeIcon, Mail, User } from 'lucide-react';
import { GooeyCursor } from '../components/lab/GooeyCursor';
import { Marquee } from '../components/lab/Marquee';
import { PerspectiveRoom } from '../components/lab/PerspectiveRoom';
import { TypeCycle } from '../components/lab/TypeCycle';
import '../styles/lab.css';

/**
 * Prova di direzione visiva: fondo chiaro, accento arancio, stanza in
 * prospettiva, titolo che si riscrive e cursore liquido.
 *
 * Vive su una rotta a sé e non tocca la home: le due direzioni si guardano
 * affiancate finché non si decide quale tenere. I contenuti sono fissi qui
 * dentro, non passano dal backoffice: è un prototipo di forma, non di dati.
 */

const ROLES = ['FULL STACK DEVELOPER', 'CREATIVE CODER', 'PROBLEM SOLVER', 'AUTOMATION BUILDER'];

const NASTRO = [
  'FULL STACK DEVELOPER',
  'REACT & NODE',
  'AUTOMAZIONI SU MISURA',
  'GESTIONALI',
  'AI AGENTS',
];

// TODO: numeri da confermare con Riccardo prima di portarli fuori dal prototipo.
const STATS = [
  { value: '3+', label: 'anni di esperienza' },
  { value: '30+', label: 'progetti realizzati' },
  { value: '100%', label: 'codice scritto a mano' },
];

const NAV = [
  { icon: HomeIcon, label: 'Home', active: true },
  { icon: User, label: 'Chi sono', active: false },
  { icon: Briefcase, label: 'Progetti', active: false },
  { icon: Mail, label: 'Contatti', active: false },
];

/**
 * Parallasse legata al puntatore. Scrive due variabili CSS sulla scena e lascia
 * che sia il CSS a decidere quanto ogni strato si sposti: così la profondità si
 * regola nel foglio di stile, dove sta il resto della composizione.
 */
function usePointerParallax<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (!window.matchMedia('(any-pointer: fine)').matches) return;

    let frame = 0;
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        // Da -1 a 1 rispetto al centro della finestra.
        const x = (e.clientX / window.innerWidth) * 2 - 1;
        const y = (e.clientY / window.innerHeight) * 2 - 1;
        el.style.setProperty('--px', x.toFixed(3));
        el.style.setProperty('--py', y.toFixed(3));
      });
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('pointermove', onMove);
    };
  }, []);

  return ref;
}

export default function Lab() {
  const scene = usePointerParallax<HTMLDivElement>();

  // La classe sta sull'elemento radice e non sulla pagina: fondo e cursore
  // devono valere anche per l'area fuori dal contenuto, sui monitor alti.
  useEffect(() => {
    document.documentElement.classList.add('lab-mode');
    return () => document.documentElement.classList.remove('lab-mode');
  }, []);

  return (
    <div className="lab" ref={scene}>
      <GooeyCursor />
      <PerspectiveRoom />

      <header className="lab-top">
        <a className="lab-brand" href="/">
          <span className="lab-brand-star" aria-hidden="true" />
          portfolio
        </a>

        <nav className="lab-nav" aria-label="Sezioni">
          {NAV.map(({ icon: Icon, label, active }) => (
            <a key={label} href="#" className={`lab-nav-item${active ? ' is-active' : ''}`}>
              <Icon aria-hidden="true" />
              {label}
            </a>
          ))}
        </nav>

        <div className="lab-intro">
          <p className="lab-signature">Riccardo Sensi</p>
          <p className="lab-bio">
            Costruisco gestionali, automazioni e interfacce che stanno in piedi anche quando i dati
            veri arrivano tutti insieme.
          </p>
          <a className="lab-cta" href="#contatti">
            PARLIAMONE <ArrowUpRight aria-hidden="true" />
          </a>
        </div>
      </header>

      <main className="lab-stage">
        <h1 className="lab-title">
          <span className="lab-title-ghost">SONO NATO PER</span>
          <span className="lab-title-live">
            <TypeCycle words={ROLES} />
          </span>
        </h1>

        {/* Il piedistallo dove andrà il ritratto ritagliato: finché non c'è,
            regge da solo la composizione invece di lasciare un buco. */}
        <div className="lab-portrait" aria-hidden="true">
          <span className="lab-portrait-arch" />
        </div>
      </main>

      <ul className="lab-stats">
        {STATS.map(({ value, label }) => (
          <li key={label}>
            <strong>{value}</strong>
            <span>{label}</span>
          </li>
        ))}
      </ul>

      {/* Il nero prima, così l'arancio gli passa sopra all'incrocio. */}
      <Marquee items={NASTRO} duration={38} tilt={3.2} reverse />
      <Marquee items={NASTRO} duration={30} tilt={-3.2} />
    </div>
  );
}
