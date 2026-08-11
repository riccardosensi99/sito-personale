import { useEffect, useState } from 'react';
import { Briefcase, Home as HomeIcon, Mail, User } from 'lucide-react';

/**
 * La pillola di navigazione, fissa in alto: resta a portata anche a metà
 * pagina, ed evidenzia la sezione che si sta guardando.
 *
 * La sezione attiva la decide un IntersectionObserver e non lo scroll: leggere
 * la posizione a ogni evento di scorrimento vorrebbe dire misurare l'altezza di
 * ogni sezione a mano, e sbagliarla appena una cambia di contenuto.
 *
 * L'ancora nell'URL segue la stessa sezione: scritta una volta dal clic, senza
 * aggiornarla resterebbe lì mentre si scorre altrove, e un link copiato a metà
 * pagina riporterebbe al punto sbagliato.
 */

export const SECTIONS = [
  { id: 'home', label: 'Home', icon: HomeIcon },
  { id: 'chi-sono', label: 'Chi sono', icon: User },
  { id: 'progetti', label: 'Progetti', icon: Briefcase },
  { id: 'contatti', label: 'Contatti', icon: Mail },
] as const;

/// La prima è la cima della pagina: l'unica che nell'indirizzo non si scrive.
const CIMA = SECTIONS[0].id;

/**
 * Allinea l'ancora dell'URL alla sezione in vista.
 *
 * replaceState e non l'`hash` del router: quello rimonterebbe la rotta e
 * rifarebbe lo scroll verso l'ancora appena scritta, litigando con lo scroll
 * vero della persona. Qui la cronologia non cresce e React non se ne accorge —
 * cambia solo ciò che si legge nella barra degli indirizzi.
 *
 * Su `home` l'ancora sparisce del tutto: in cima l'indirizzo del sito è la sua
 * radice, non `/#home`.
 */
function sincronizzaAncora(id: string) {
  const atteso = id === CIMA ? '' : `#${id}`;
  if (window.location.hash === atteso) return;
  const { pathname, search } = window.location;
  window.history.replaceState(window.history.state, '', `${pathname}${search}${atteso}`);
}

/**
 * Porta la pagina sull'ancora con cui è stata aperta.
 *
 * Il salto automatico del browser non funziona qui: quando legge il frammento
 * la pagina è ancora il div vuoto, e la sezione nasce solo dopo che React ha
 * reso. E non basta saltare una volta — i progetti arrivano dall'API e la
 * pagina si allunga sotto ai piedi, portandosi via la sezione appena raggiunta.
 * Perciò si insiste a ogni cambio d'altezza, finché non è la persona a scorrere.
 *
 * Restituisce la funzione che smette di insistere.
 */
function saltaAllAncora(targets: HTMLElement[]) {
  const wanted = document.getElementById(window.location.hash.slice(1));
  if (!wanted || !targets.includes(wanted)) return () => {};

  // instant e non il morbido dichiarato in CSS: all'apertura non c'è un percorso
  // da mostrare, c'è solo un punto di partenza.
  const vai = () => wanted.scrollIntoView({ behavior: 'instant' as ScrollBehavior });
  vai();

  const ro = new ResizeObserver(vai);
  ro.observe(document.documentElement);

  const basta = () => {
    ro.disconnect();
    window.removeEventListener('wheel', basta);
    window.removeEventListener('touchstart', basta);
    window.removeEventListener('keydown', basta);
    window.clearTimeout(timer);
  };
  const timer = window.setTimeout(basta, 3000);
  window.addEventListener('wheel', basta, { passive: true });
  window.addEventListener('touchstart', basta, { passive: true });
  window.addEventListener('keydown', basta);

  return basta;
}

export function Nav() {
  const [active, setActive] = useState('home');

  useEffect(() => {
    const targets = SECTIONS.map(({ id }) => document.getElementById(id)).filter(
      (el): el is HTMLElement => el !== null,
    );
    if (targets.length === 0) return;

    // Prima del mirino, altrimenti l'osservatore vedrebbe la cima della pagina
    // e cancellerebbe dall'indirizzo proprio l'ancora che stiamo per seguire.
    const smettiDiInsistere = saltaAllAncora(targets);

    // La fascia centrale dello schermo fa da mirino: la sezione attiva è quella
    // che la occupa, non quella che si affaccia appena dal bordo.
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length === 0) return;
        const top = visible.reduce((a, b) => (a.intersectionRatio > b.intersectionRatio ? a : b));
        setActive(top.target.id);
        sincronizzaAncora(top.target.id);
      },
      { rootMargin: '-45% 0px -45% 0px', threshold: 0 },
    );

    targets.forEach((el) => io.observe(el));
    return () => {
      smettiDiInsistere();
      io.disconnect();
    };
  }, []);

  return (
    <nav className="site-nav" aria-label="Sezioni">
      {SECTIONS.map(({ id, label, icon: Icon }) => (
        <a
          key={id}
          href={`#${id}`}
          className={`site-nav-item${active === id ? ' is-active' : ''}`}
          aria-current={active === id ? 'true' : undefined}
        >
          <Icon aria-hidden="true" />
          {/* In uno span perché su schermo stretto l'etichetta va nascosta alla
              vista ma non a chi naviga con uno screen reader. */}
          <span className="site-nav-label">{label}</span>
        </a>
      ))}
    </nav>
  );
}
