import { useEffect, useRef, useState } from 'react';

/**
 * La copertina: il marchio grande al centro e due parole, per il primo istante
 * di una visita.
 *
 * Non è un finto caricamento. Copre il tempo in cui i contenuti stanno davvero
 * arrivando e se ne va appena ci sono — con un minimo, perché un lampo di
 * duecento millisecondi si legge come un difetto, e con un tetto, perché
 * un'API che non risponde non deve tenere in ostaggio chi è appena arrivato.
 *
 * Il sito sotto è già montato e già nel DOM: questa passa sopra e basta. Chi
 * indicizza legge la pagina, non la copertina.
 */

/// Le due parole. Stanno nel codice e non fra i contenuti del backoffice per il
/// motivo per cui esiste questo componente: si vedono prima che i contenuti
/// arrivino, quindi non possono venire da lì.
const PAROLE = { ghost: 'BUILD', live: 'SHIP' };

/// Quanto resta come minimo, e quanto al massimo se i contenuti non arrivano.
const MINIMA = 850;
const MASSIMA = 2000;

/// Deve restare uguale alla durata di site-opening-out in site.css.
const USCITA = 480;

/// Una volta per caricamento di pagina, non per montaggio: tornando dalla
/// pagina dei cookie la home si rimonta, e rivederla lì sarebbe un intoppo.
/// Una variabile di modulo e non lo storage del browser: non c'è niente da
/// ricordare fra una visita e l'altra, e non c'è niente da dichiarare
/// nell'informativa.
let giaMostrata = false;

function vaMostrata(): boolean {
  if (giaMostrata) return false;
  // Chi arriva su un'ancora è venuto per una sezione: la copertina gliela
  // metterebbe davanti, e bloccando lo scorrimento le impedirebbe pure di
  // arrivarci.
  if (window.location.hash) return false;
  return !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

type Fase = 'aperta' | 'in-uscita' | 'finita';

export function Opening({ pronto }: { pronto: boolean }) {
  const [fase, setFase] = useState<Fase>(() => (vaMostrata() ? 'aperta' : 'finita'));
  const apertaDa = useRef(Date.now());

  useEffect(() => {
    if (fase === 'finita') return;
    giaMostrata = true;

    // Dietro non c'è ancora niente da vedere, e ritrovarsi a metà pagina quando
    // la copertina svanisce non è un arrivo.
    document.documentElement.classList.add('site-opening-on');
    return () => document.documentElement.classList.remove('site-opening-on');
  }, [fase]);

  useEffect(() => {
    if (fase !== 'aperta') return;
    const trascorso = Date.now() - apertaDa.current;
    const attesa = Math.max(0, (pronto ? MINIMA : MASSIMA) - trascorso);
    const t = window.setTimeout(() => setFase('in-uscita'), attesa);
    return () => window.clearTimeout(t);
  }, [fase, pronto]);

  useEffect(() => {
    if (fase !== 'in-uscita') return;
    const t = window.setTimeout(() => setFase('finita'), USCITA);
    return () => window.clearTimeout(t);
  }, [fase]);

  if (fase === 'finita') return null;

  return (
    // aria-hidden perché è una copertina: chi ascolta la pagina non ha motivo
    // di sentirsi annunciare due parole che coprono il contenuto vero.
    <div
      className={`site-opening${fase === 'in-uscita' ? ' is-leaving' : ''}`}
      aria-hidden="true"
    >
      <img src="/logo.webp" width={880} height={880} alt="" fetchPriority="high" />
      <p className="site-opening-words">
        <span className="site-opening-ghost">{PAROLE.ghost}</span>
        <span className="site-opening-live">{PAROLE.live}</span>
      </p>
    </div>
  );
}
