import { useEffect } from 'react';

/// Aggiunge .visible agli elementi .reveal quando entrano nel viewport.
/// Va richiamato dopo ogni cambio di contenuto: osserva solo chi non è già visibile.
export function useReveal(deps: unknown[] = []): void {
  useEffect(() => {
    const targets = document.querySelectorAll<HTMLElement>('.reveal:not(.visible)');
    if (targets.length === 0) return;

    // Senza IntersectionObserver il contenuto resterebbe a opacity 0: meglio mostrarlo subito.
    if (
      typeof IntersectionObserver === 'undefined' ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      targets.forEach((el) => el.classList.add('visible'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.12 },
    );

    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, deps);
}
