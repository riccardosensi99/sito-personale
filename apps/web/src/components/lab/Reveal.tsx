import { useEffect, useRef, type ReactNode } from 'react';

/**
 * Fa comparire il contenuto quando entra nello schermo.
 *
 * L'osservatore si stacca al primo ingresso: una sezione già vista non deve
 * ri-animarsi scorrendo all'indietro, che è il modo più veloce per far
 * sembrare nervosa una pagina lunga.
 */

type Props = { children: ReactNode; delay?: number; className?: string };

export function Reveal({ children, delay = 0, className = '' }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.classList.add('is-in');
      return;
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        el.classList.add('is-in');
        io.disconnect();
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.05 },
    );

    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className={`lab-reveal ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}
