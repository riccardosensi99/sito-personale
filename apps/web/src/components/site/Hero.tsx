import { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowDownRight } from 'lucide-react';
import { Terminal } from './Terminal';
import type { HeroSettings, TerminalSettings } from '../../lib/types';

type Props = { hero: HeroSettings; terminal: TerminalSettings };

/// L'entrata è scaglionata: prima il logo, poi il claim, poi il testo di supporto.
/// I delay stanno qui e non nel CSS perché devono restare in ordine tra loro.
const rise = (delay: number) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const, delay },
});

/// La porta chiede una scena bloccata più alta del viewport e una rotazione 3D:
/// su schermi stretti o bassi il contenuto della hero verrebbe tagliato, e con
/// prefers-reduced-motion il movimento non deve esistere affatto.
const DOOR_QUERY =
  '(min-width: 900px) and (min-height: 640px) and (prefers-reduced-motion: no-preference)';

function useDoorEnabled(): boolean {
  // Valore letto già al primo render: useScroll si aggancia al ref quando la
  // scena entra nel DOM, quindi la traccia deve esserci fin da subito.
  const [on, setOn] = useState(() => window.matchMedia(DOOR_QUERY).matches);

  useEffect(() => {
    const mq = window.matchMedia(DOOR_QUERY);
    const sync = () => setOn(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  return on;
}

export function Hero({ hero, terminal }: Props) {
  const door = useDoorEnabled();

  // Due componenti distinti e non un ramo dentro lo stesso: passando da mobile a
  // desktop la scena si monta da capo e il suo useScroll misura la traccia vera.
  return door ? (
    <HeroDoorScene hero={hero} terminal={terminal} />
  ) : (
    <>
      <section className="hero hero--plain">
        <HeroPanel hero={hero} />
      </section>
      <TerminalBand terminal={terminal} />
    </>
  );
}

function HeroDoorScene({ hero, terminal }: Props) {
  const trackRef = useRef<HTMLElement>(null);

  // 'end end' fa coincidere 0→1 con la corsa in cui la scena resta incollata.
  const { scrollYProgress } = useScroll({
    target: trackRef,
    offset: ['start start', 'end end'],
  });

  // Segni opposti sui due lati e cardini ai bordi: i battenti si allontanano
  // dall'osservatore. Ruotandoli verso di sé le due metà si sovrappongono al
  // centro e il contenuto diventa illeggibile a metà corsa.
  const leftRotate = useTransform(scrollYProgress, [0, 0.46], [0, 84]);
  const rightRotate = useTransform(scrollYProgress, [0, 0.46], [0, -84]);
  // A fine apertura l'anta scivola fuori dalla propria metà, che la ritaglia.
  // Serve perché a 90° resta comunque un cuneo di dorso appeso al cardine, e
  // farlo sparire in dissolvenza si è rivelato poco affidabile.
  const leftSlide = useTransform(scrollYProgress, [0.42, 0.52], ['0%', '-120%']);
  const rightSlide = useTransform(scrollYProgress, [0.42, 0.52], ['0%', '120%']);
  const seam = useTransform(scrollYProgress, [0, 0.04, 0.32, 0.46], [0, 1, 1, 0]);
  const revealOpacity = useTransform(scrollYProgress, [0.22, 0.5], [0, 1]);
  const revealScale = useTransform(scrollYProgress, [0.22, 0.56], [0.93, 1]);

  return (
    <section className="hero-track" ref={trackRef}>
      <div className="hero-pin">
        {/* Dietro le ante: il terminale, che si scopre man mano che si aprono. */}
        <motion.div className="hero-reveal" style={{ opacity: revealOpacity, scale: revealScale }}>
          <TerminalBand terminal={terminal} inScene />
        </motion.div>

        <div className="hero-doors">
          <div className="hero-half hero-half--left">
            <motion.div
              className="hero-leaf hero-leaf--left"
              style={{ rotateY: leftRotate, x: leftSlide }}
            >
              <div className="hero-leaf-inner">
                <HeroPanel hero={hero} />
              </div>
            </motion.div>
          </div>

          {/* Copia speculare: stessa DOM, quindi inert per non farla leggere due volte. */}
          <div className="hero-half hero-half--right" aria-hidden="true" inert>
            <motion.div
              className="hero-leaf hero-leaf--right"
              style={{ rotateY: rightRotate, x: rightSlide }}
            >
              <div className="hero-leaf-inner">
                <HeroPanel hero={hero} mirror />
              </div>
            </motion.div>
          </div>

          <motion.span className="hero-seam" style={{ opacity: seam }} aria-hidden="true" />
        </div>
      </div>
    </section>
  );
}

/// `mirror` è la copia dentro l'anta destra: stessi pixel, ma niente h1 duplicato.
/// aria-hidden la toglie dall'albero di accessibilità, non dal DOM che legge un crawler.
function HeroPanel({ hero, mirror = false }: { hero: HeroSettings; mirror?: boolean }) {
  const Claim = mirror ? 'div' : 'h1';

  return (
    <div className="hero-panel">
      <div className="container hero-stage">
        <motion.div className="hero-intro" {...rise(0.75)}>
          {hero.available && (
            <div className="eyebrow">
              <span className="eyebrow-dot" /> {hero.availableLabel}
            </div>
          )}
          <p className="hero-lead">
            {hero.titleLead} <span className="gradient-text">{hero.titleAccent}</span>
          </p>
          <p className="hero-copy">{hero.copy}</p>
          <div className="hero-actions">
            <a className="btn btn-primary" href="#projects">
              Esplora i progetti
              <ArrowDownRight aria-hidden="true" />
            </a>
            <a className="btn btn-secondary" href="#contact">
              Parliamone
            </a>
          </div>
        </motion.div>

        <div className="hero-logo-wrap">
          <motion.div
            className="hero-halo"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
          />
          <motion.div
            className="hero-ring"
            initial={{ opacity: 0, scale: 0.9, rotate: -12 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
          />
          <motion.img
            className="hero-logo"
            src="/logo.webp"
            width={880}
            height={880}
            alt="Logo RS di Riccardo Sensi"
            fetchPriority="high"
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
          />
        </div>

        {/* Nessuna didascalia sotto il claim: "Full Stack · Flutter · AI" tornava
            tre volte nella stessa schermata. Ora quei tre punti vivono solo in fondo. */}
        <motion.div className="hero-statement-col" {...rise(0.5)}>
          <Claim className="hero-statement">
            <em>{hero.claimLead}</em>
            <em>{hero.claimTrail}</em>
          </Claim>
        </motion.div>
      </div>
    </div>
  );
}

/// Il terminale: dentro la scena della porta è il fondale che si scopre, fuori
/// (mobile, reduced motion) è una fascia normale subito sotto la hero.
function TerminalBand({
  terminal,
  inScene = false,
}: {
  terminal: TerminalSettings;
  inScene?: boolean;
}) {
  const body = (
    <div className="container terminal-grid">
      <div className={inScene ? undefined : 'reveal'}>
        <div className="section-kicker">Setup</div>
        <h2>
          Lo stack,
          <br />
          senza slide.
        </h2>
        <p className="section-lead">
          Quello che uso davvero tutti i giorni, dal frontend al server. È scritto nei contenuti del
          sito: cambia quando cambia il mio lavoro, non quando ricordo di rifare il deploy.
        </p>
      </div>
      <div className={inScene ? undefined : 'reveal'}>
        <Terminal terminal={terminal} />
      </div>
    </div>
  );

  return inScene ? body : <section className="terminal-band">{body}</section>;
}
