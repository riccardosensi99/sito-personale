import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowUpRight, Menu, X } from 'lucide-react';

const LINKS = [
  { href: '#projects', label: 'Progetti' },
  { href: '#services', label: 'Servizi' },
  { href: '#about', label: 'Esperienza' },
  { href: '#contact', label: 'Contatti' },
];

export function Nav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // La barra si "chiude" appena la pagina si stacca dall'hero.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Con il menu aperto il body non deve scorrere sotto, e Esc lo chiude.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <>
      <nav className={`nav${scrolled ? ' is-scrolled' : ''}`}>
        <a className="brand" href="#top" aria-label="Riccardo Sensi — torna in cima">
          <img className="brand-mark" src="/logo-mark.webp" width={256} height={256} alt="" />
          <span className="brand-name">
            Riccardo Sensi
            <span className="brand-role">Full Stack Developer</span>
          </span>
        </a>

        <div className="nav-links">
          {LINKS.map((link) => (
            <a key={link.href} href={link.href}>
              {link.label}
            </a>
          ))}
        </div>

        <div className="nav-right">
          <a className="nav-cta" href="#contact">
            Parliamone
            <ArrowUpRight aria-hidden="true" />
          </a>
          <button
            type="button"
            className="nav-burger"
            aria-label={open ? 'Chiudi il menu' : 'Apri il menu'}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            className="nav-sheet"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {LINKS.map((link) => (
              <a key={link.href} href={link.href} onClick={() => setOpen(false)}>
                {link.label}
              </a>
            ))}
            <a className="btn btn-primary" href="#contact" onClick={() => setOpen(false)}>
              Parliamone
              <ArrowUpRight aria-hidden="true" />
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
