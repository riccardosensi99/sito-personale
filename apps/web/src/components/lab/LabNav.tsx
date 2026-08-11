import { useEffect, useState } from 'react';
import { Briefcase, Home as HomeIcon, Mail, User } from 'lucide-react';

/**
 * La pillola di navigazione, fissa in alto: resta a portata anche a metà
 * pagina, ed evidenzia la sezione che si sta guardando.
 *
 * La sezione attiva la decide un IntersectionObserver e non lo scroll: leggere
 * la posizione a ogni evento di scorrimento vorrebbe dire misurare l'altezza di
 * ogni sezione a mano, e sbagliarla appena una cambia di contenuto.
 */

export const SECTIONS = [
  { id: 'home', label: 'Home', icon: HomeIcon },
  { id: 'chi-sono', label: 'Chi sono', icon: User },
  { id: 'progetti', label: 'Progetti', icon: Briefcase },
  { id: 'contatti', label: 'Contatti', icon: Mail },
];

export function LabNav() {
  const [active, setActive] = useState('home');

  useEffect(() => {
    const targets = SECTIONS.map(({ id }) => document.getElementById(id)).filter(
      (el): el is HTMLElement => el !== null,
    );
    if (targets.length === 0) return;

    // La fascia centrale dello schermo fa da mirino: la sezione attiva è quella
    // che la occupa, non quella che si affaccia appena dal bordo.
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length === 0) return;
        const top = visible.reduce((a, b) => (a.intersectionRatio > b.intersectionRatio ? a : b));
        setActive(top.target.id);
      },
      { rootMargin: '-45% 0px -45% 0px', threshold: 0 },
    );

    targets.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <nav className="lab-nav" aria-label="Sezioni">
      {SECTIONS.map(({ id, label, icon: Icon }) => (
        <a
          key={id}
          href={`#${id}`}
          className={`lab-nav-item${active === id ? ' is-active' : ''}`}
          aria-current={active === id ? 'true' : undefined}
        >
          <Icon aria-hidden="true" />
          {/* In uno span perché su schermo stretto l'etichetta va nascosta alla
              vista ma non a chi naviga con uno screen reader. */}
          <span className="lab-nav-label">{label}</span>
        </a>
      ))}
    </nav>
  );
}
