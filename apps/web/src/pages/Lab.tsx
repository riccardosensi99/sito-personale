import { useEffect, useRef } from 'react';
import { ArrowUpRight, Download, Mail } from 'lucide-react';
// lucide non distribuisce più le icone dei marchi: stanno in BrandIcons.
import { GithubIcon, LinkedinIcon } from '../components/site/BrandIcons';
import { GooeyCursor } from '../components/lab/GooeyCursor';
import { LabNav } from '../components/lab/LabNav';
import { Marquee } from '../components/lab/Marquee';
import { PerspectiveRoom } from '../components/lab/PerspectiveRoom';
import { Reveal } from '../components/lab/Reveal';
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
];

// Presi dal seed dell'API, dove stanno i contatti veri del sito.
const CONTATTI = {
  email: 'riccardosensi57@gmail.com',
  github: 'https://github.com/riccardosensi99',
  linkedin: 'https://linkedin.com/in/riccardo-sensi-developer',
};

// TODO: il PDF non è ancora nel repo. Finché non lo si mette in
// apps/web/public/ questo link risponde 404.
const CV_URL = '/riccardo-sensi-cv.pdf';

const COMPETENZE = [
  { titolo: 'Backend', voci: 'Node, Express, Prisma, PostgreSQL, autenticazione e ruoli' },
  { titolo: 'Frontend', voci: 'React, TypeScript, Vite, animazioni e design system' },
  { titolo: 'Infrastruttura', voci: 'Docker, nginx, deploy su VPS, ambienti separati' },
  { titolo: 'Automazioni', voci: 'agenti, integrazioni fra servizi, script che tolgono lavoro' },
];

const PROGETTI = [
  {
    nome: 'Gestionale Ore',
    tipo: 'Gestionale',
    testo: 'Presenze, commesse e rendicontazione per chi lavora a cantieri aperti.',
    tags: ['React', 'Express', 'PostgreSQL'],
  },
  {
    nome: 'CRUD Lib',
    tipo: 'Open source',
    testo: 'Libreria modulare che toglie di mezzo il codice ripetitivo di ogni nuovo backend.',
    tags: ['TypeScript', 'Prisma', 'NPM'],
  },
  {
    nome: 'TradingView Quant Lab',
    tipo: 'Ricerca',
    testo: 'Strumenti per scrivere, testare e misurare strategie su dati veri.',
    tags: ['TypeScript', 'Pine Script', 'Backtesting'],
  },
  {
    nome: 'Sito Personale',
    tipo: 'Portfolio',
    testo: 'Questo sito: backoffice privato, import dei repository e nessun deploy per cambiare un testo.',
    tags: ['React', 'Docker', 'Prisma'],
  },
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

  // La classe sta sull'elemento radice e non sulla pagina: fondo, cursore e
  // scorrimento morbido devono valere anche oltre il contenuto.
  useEffect(() => {
    document.documentElement.classList.add('lab-mode');
    return () => document.documentElement.classList.remove('lab-mode');
  }, []);

  return (
    <div className="lab" ref={scene}>
      <GooeyCursor />
      <LabNav />

      {/* ═══ Home ═══ */}
      <section className="lab-hero" id="home">
        <PerspectiveRoom />

        <header className="lab-top">
          <a className="lab-brand" href="#home" aria-label="Riccardo Sensi, torna in cima">
            <img src="/logo-mark.webp" width={256} height={256} alt="" />
          </a>

          <div className="lab-intro">
            <p className="lab-signature">
              <img src="/logo-mark.webp" width={256} height={256} alt="" />
              Riccardo Sensi
            </p>
            <p className="lab-bio">
              Costruisco gestionali, automazioni e interfacce che stanno in piedi anche quando i dati
              veri arrivano tutti insieme.
            </p>
            <a className="lab-cta" href="#contatti">
              PARLIAMONE <ArrowUpRight aria-hidden="true" />
            </a>
          </div>
        </header>

        <div className="lab-stage">
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
        </div>

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
      </section>

      {/* ═══ Chi sono ═══ */}
      <section className="lab-section" id="chi-sono">
        <Reveal>
          <p className="lab-kicker">01 — Chi sono</p>
          <h2 className="lab-h2">
            Scrivo software che <em>regge</em> quando smette di essere una demo.
          </h2>
        </Reveal>

        <div className="lab-about">
          <Reveal delay={80}>
            <p className="lab-lead">
              Lavoro sul pezzo intero: il database, l'API, l'interfaccia e la macchina su cui gira.
              Mi interessa la parte che di solito si scopre dopo — i permessi, i casi limite, cosa
              succede quando due persone salvano lo stesso record nello stesso momento.
            </p>
            <p className="lab-lead">
              Preferisco poche schermate che fanno esattamente ciò che serve a una dashboard piena di
              grafici che nessuno guarda.
            </p>
          </Reveal>

          <div className="lab-skills">
            {COMPETENZE.map(({ titolo, voci }, i) => (
              <Reveal key={titolo} delay={120 + i * 70}>
                <div className="lab-skill">
                  <h3>{titolo}</h3>
                  <p>{voci}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ Progetti ═══ */}
      <section className="lab-section" id="progetti">
        <Reveal>
          <p className="lab-kicker">02 — Progetti</p>
          <h2 className="lab-h2">Cose che girano, non slide.</h2>
        </Reveal>

        <div className="lab-projects">
          {PROGETTI.map(({ nome, tipo, testo, tags }, i) => (
            <Reveal key={nome} delay={60 + i * 80}>
              <article className="lab-project">
                <span className="lab-project-num">{String(i + 1).padStart(2, '0')}</span>
                <p className="lab-project-type">{tipo}</p>
                <h3>{nome}</h3>
                <p className="lab-project-text">{testo}</p>
                <ul className="lab-tags">
                  {tags.map((tag) => (
                    <li key={tag}>{tag}</li>
                  ))}
                </ul>
                <span className="lab-project-arrow" aria-hidden="true">
                  <ArrowUpRight />
                </span>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ═══ Contatti ═══ */}
      <section className="lab-section lab-section--contact" id="contatti">
        <Reveal>
          <p className="lab-kicker">03 — Contatti</p>
          <h2 className="lab-h2 lab-h2--big">
            Hai un'idea che <em>deve funzionare</em>?
          </h2>
          <a className="lab-mail" href={`mailto:${CONTATTI.email}`}>
            {CONTATTI.email}
            <ArrowUpRight aria-hidden="true" />
          </a>
        </Reveal>
      </section>

      <footer className="lab-footer">
        <div className="lab-footer-main">
          <div className="lab-footer-brand">
            <img src="/logo-mark.webp" width={256} height={256} alt="" />
            <div>
              <strong>Riccardo Sensi</strong>
              <span>Full stack developer</span>
            </div>
          </div>

          <a className="lab-cv" href={CV_URL} download>
            <Download aria-hidden="true" />
            Scarica il CV
          </a>

          <div className="lab-social">
            <a href={CONTATTI.github} target="_blank" rel="noreferrer" aria-label="GitHub">
              <GithubIcon aria-hidden="true" />
            </a>
            <a href={CONTATTI.linkedin} target="_blank" rel="noreferrer" aria-label="LinkedIn">
              <LinkedinIcon aria-hidden="true" />
            </a>
            <a href={`mailto:${CONTATTI.email}`} aria-label="Email">
              <Mail aria-hidden="true" />
            </a>
          </div>
        </div>

        <p className="lab-footer-note">© {new Date().getFullYear()} Riccardo Sensi</p>
      </footer>
    </div>
  );
}
