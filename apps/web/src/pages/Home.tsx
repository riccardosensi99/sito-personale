import { useEffect, useRef } from 'react';
import { ArrowUpRight, Download, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import { CookieNotice } from '../components/site/CookieNotice';
// lucide non distribuisce più le icone dei marchi: stanno in BrandIcons.
import { GithubIcon, LinkedinIcon } from '../components/site/BrandIcons';
import { GooeyCursor } from '../components/site/GooeyCursor';
import { Nav } from '../components/site/Nav';
import { Marquee } from '../components/site/Marquee';
import { PerspectiveRoom } from '../components/site/PerspectiveRoom';
import { ProjectCard } from '../components/site/ProjectCard';
import { Reveal } from '../components/site/Reveal';
import { TypeCycle } from '../components/site/TypeCycle';
import { useSiteData } from '../hooks/useSiteData';
import { enfasi } from '../lib/enfasi';
import { SEO_HOME, SITE_URL, useJsonLd, useSeo } from '../lib/seo';
import '../styles/site.css';

/**
 * Il sito: fondo chiaro, accento arancio, stanza in prospettiva, titolo che si
 * riscrive e cursore liquido. Una pagina sola, per sezioni.
 *
 * I contenuti arrivano tutti dal backoffice: i progetti dalla tabella, i testi
 * dal blocco `home` delle impostazioni, i recapiti da `contact` e il CV da `cv`.
 * Cambiare una parola o pubblicare un progetto non richiede un deploy.
 */

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

export default function Home() {
  const scene = usePointerParallax<HTMLDivElement>();

  const { projects, settings, loading, error } = useSiteData();
  const { home, contact } = settings;

  // Il CV è rimosso scrivendo `{}` sulla chiave: conta l'url, non la chiave.
  const cvUrl = settings.cv?.url || null;

  // Rimessi da capo perché tornando da /cookie sarebbero rimasti i suoi.
  useSeo(SEO_HOME);

  // Il titolo della pagina è un h1 che si riscrive da solo e i recapiti sono
  // icone: nessuna delle due cose si legge come un dato. Qui invece sì, e sono
  // gli stessi che si curano dal backoffice.
  useJsonLd({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Person',
        '@id': `${SITE_URL}/#persona`,
        name: home.nome,
        jobTitle: home.ruolo,
        description: home.bio,
        url: `${SITE_URL}/`,
        image: `${SITE_URL}/og.jpg`,
        email: `mailto:${contact.email}`,
        ...(home.piva ? { vatID: home.piva } : {}),
        knowsAbout: home.about.skills.map(({ title }) => title),
        sameAs: [contact.github, contact.linkedin].filter(Boolean),
      },
      {
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#sito`,
        url: `${SITE_URL}/`,
        name: home.nome,
        inLanguage: 'it-IT',
        author: { '@id': `${SITE_URL}/#persona` },
      },
    ],
  });

  // La classe sta sull'elemento radice e non sulla pagina: fondo, cursore e
  // scorrimento morbido devono valere anche oltre il contenuto.
  useEffect(() => {
    document.documentElement.classList.add('site-mode');
    return () => document.documentElement.classList.remove('site-mode');
  }, []);

  return (
    <div className="site" ref={scene}>
      <GooeyCursor />
      <Nav />
      <CookieNotice />

      {/* ═══ Home ═══ */}
      <section className="site-hero" id="home">
        <PerspectiveRoom />

        <header className="site-top">
          <a className="site-brand" href="#home" aria-label={`${home.nome}, torna in cima`}>
            <img src="/logo-mark.webp" width={256} height={256} alt="" />
          </a>

          <div className="site-intro">
            <p className="site-signature">
              <img src="/logo-mark.webp" width={256} height={256} alt="" />
              {home.nome}
            </p>
            <p className="site-bio">{home.bio}</p>
            <a className="site-cta" href="#contatti">
              {home.ctaLabel} <ArrowUpRight aria-hidden="true" />
            </a>
          </div>
        </header>

        <div className="site-stage">
          <h1 className="site-title">
            <span className="site-title-ghost">{home.titleGhost}</span>
            <span className="site-title-live">
              <TypeCycle words={home.roles} />
            </span>
          </h1>

          {/* Il piedistallo dove andrà il ritratto ritagliato: finché non c'è,
              regge da solo la composizione invece di lasciare un buco. */}
          <div className="site-portrait" aria-hidden="true">
            <span className="site-portrait-arch" />
          </div>
        </div>

        <ul className="site-stats">
          {home.stats.map(({ value, label }) => (
            <li key={label}>
              <strong>{value}</strong>
              <span>{label}</span>
            </li>
          ))}
        </ul>

        {/* Il nero prima, così l'arancio gli passa sopra all'incrocio. */}
        <Marquee items={home.marquee} duration={38} tilt={3.2} reverse />
        <Marquee items={home.marquee} duration={30} tilt={-3.2} />
      </section>

      {/* ═══ Chi sono ═══ */}
      <section className="site-section" id="chi-sono">
        <Reveal>
          <p className="site-kicker">{home.about.kicker}</p>
          <h2 className="site-h2">{enfasi(home.about.title)}</h2>
        </Reveal>

        <div className="site-about">
          <Reveal delay={80}>
            {home.about.paragraphs.map((testo) => (
              <p className="site-lead" key={testo}>
                {enfasi(testo)}
              </p>
            ))}
            {home.about.note && (
              <p className="site-lead site-lead--mark">{enfasi(home.about.note)}</p>
            )}
          </Reveal>

          <div className="site-skills">
            {home.about.skills.map(({ title, text }, i) => (
              <Reveal key={title} delay={120 + i * 70}>
                <div className="site-skill">
                  <h3>{title}</h3>
                  <p>{text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ Progetti ═══ */}
      <section className="site-section" id="progetti">
        <Reveal>
          <p className="site-kicker">{home.projects.kicker}</p>
          <h2 className="site-h2">{enfasi(home.projects.title)}</h2>
        </Reveal>

        {/* Mentre carica non c'è nessun segnaposto: le card compaiono già una
            alla volta, e un finto elenco che si ridisegna si noterebbe di più
            del vuoto di mezzo secondo che sostituisce. */}
        {error && <p className="site-lead">{error}</p>}
        {!loading && !error && projects.length === 0 && (
          <p className="site-lead">{home.projects.empty}</p>
        )}

        <div className="site-projects">
          {projects.map((progetto, i) => (
            <Reveal key={progetto.id} delay={60 + i * 80}>
              <ProjectCard project={progetto} index={i} />
            </Reveal>
          ))}
        </div>
      </section>

      {/* ═══ Contatti ═══ */}
      <section className="site-section site-section--contact" id="contatti">
        <Reveal>
          <p className="site-kicker">{home.contact.kicker}</p>
          <h2 className="site-h2 site-h2--big">{enfasi(home.contact.title)}</h2>
          <a className="site-mail" href={`mailto:${contact.email}`}>
            {contact.email}
            <ArrowUpRight aria-hidden="true" />
          </a>
        </Reveal>
      </section>

      <footer className="site-footer">
        <div className="site-footer-main">
          <div className="site-footer-brand">
            <img src="/logo-mark.webp" width={256} height={256} alt="" />
            <div>
              <strong>{home.nome}</strong>
              <span>{home.ruolo}</span>
            </div>
          </div>

          {/* Niente pulsante se il CV non è stato caricato: meglio assente che
              puntato su un 404. */}
          {cvUrl && (
            <a className="site-cv" href={cvUrl} download>
              <Download aria-hidden="true" />
              Scarica il CV
            </a>
          )}

          <div className="site-social">
            <a href={contact.github} target="_blank" rel="noreferrer" aria-label="GitHub">
              <GithubIcon aria-hidden="true" />
            </a>
            <a href={contact.linkedin} target="_blank" rel="noreferrer" aria-label="LinkedIn">
              <LinkedinIcon aria-hidden="true" />
            </a>
            <a href={`mailto:${contact.email}`} aria-label="Email">
              <Mail aria-hidden="true" />
            </a>
          </div>
        </div>

        <p className="site-footer-note">
          © {new Date().getFullYear()} {home.nome}
          {home.piva && <span>P. IVA {home.piva}</span>}
          <Link to="/cookie">Cookie</Link>
        </p>
      </footer>
    </div>
  );
}
