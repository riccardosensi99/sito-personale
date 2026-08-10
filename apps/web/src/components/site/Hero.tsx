import { motion } from 'framer-motion';
import { ArrowDownRight, Mail, MapPin } from 'lucide-react';
import { GithubIcon, LinkedinIcon } from './BrandIcons';
import type { ContactSettings, HeroSettings } from '../../lib/types';

type Props = { hero: HeroSettings; contact: ContactSettings };

/// L'entrata è scaglionata: prima il logo, poi il claim, poi il testo di supporto.
/// I delay stanno qui e non nel CSS perché devono restare in ordine tra loro.
const rise = (delay: number) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const, delay },
});

export function Hero({ hero, contact }: Props) {
  const socials = [
    { icon: GithubIcon, href: contact.github, label: 'GitHub' },
    { icon: LinkedinIcon, href: contact.linkedin, label: 'LinkedIn' },
    { icon: Mail, href: `mailto:${contact.email}`, label: 'Email' },
  ];

  return (
    <section className="hero">
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
            width={900}
            height={900}
            alt="Logo RS di Riccardo Sensi"
            fetchPriority="high"
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
          />
        </div>

        <motion.div className="hero-statement-col" {...rise(0.5)}>
          <h1 className="hero-statement">
            <em>{hero.claimLead}</em>
            <em>{hero.claimTrail}</em>
          </h1>
          <p className="hero-statement-caption">Full Stack · Flutter · AI</p>
        </motion.div>
      </div>

      <motion.div className="container hero-foot" {...rise(1)}>
        <div className="hero-socials">
          {socials.map(({ icon: Icon, href, label }) => (
            <a
              key={label}
              className="icon-link"
              href={href}
              target={href.startsWith('mailto:') ? undefined : '_blank'}
              rel="noreferrer"
              aria-label={label}
            >
              <Icon aria-hidden="true" />
            </a>
          ))}
        </div>

        <div className="hero-meta">
          {hero.highlights.map((h) => (
            <div key={h.title}>
              <strong>{h.title}</strong>
              <span>{h.text}</span>
            </div>
          ))}
        </div>

        <div className="hero-location">
          <MapPin aria-hidden="true" />
          Italia · Remote
        </div>
      </motion.div>
    </section>
  );
}
