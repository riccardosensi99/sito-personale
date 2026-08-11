import { useEffect, useState } from 'react';
import { Cookie } from 'lucide-react';
import { Link } from 'react-router-dom';
import { OPZIONALI, leggiConsenso, salvaConsenso } from '../../lib/consent';

/**
 * Avviso sui cookie.
 *
 * Con OPZIONALI vuota — la situazione di oggi — è un'informativa breve con un
 * solo bottone: il sito usa un cookie tecnico e basta, non c'è niente da
 * concedere o negare. Appena una categoria non necessaria entra in quella
 * lista, l'avviso diventa una scelta e mostra rifiuta accanto ad accetta, con
 * lo stesso peso visivo: un rifiuto più difficile da premere dell'accettazione
 * non è un rifiuto libero.
 */
export function CookieNotice() {
  const [visibile, setVisibile] = useState(false);

  useEffect(() => {
    // Al primo frame no: comparire insieme al resto della pagina la fa
    // sembrare parte del layout invece che un avviso.
    const t = window.setTimeout(() => setVisibile(leggiConsenso() === null), 900);
    return () => window.clearTimeout(t);
  }, []);

  if (!visibile) return null;

  const decidi = (ok: string[]) => {
    salvaConsenso(ok);
    setVisibile(false);
  };

  const scelta = OPZIONALI.length > 0;

  return (
    <div className="site-cookie" role="dialog" aria-label="Informativa sui cookie">
      <span className="site-cookie-icon" aria-hidden="true">
        <Cookie />
      </span>

      <p>
        {scelta ? (
          <>
            Questo sito usa cookie tecnici, necessari a farlo funzionare, e vorrebbe usarne altri
            non necessari. Puoi accettarli o rifiutarli: nel secondo caso il sito funziona
            esattamente uguale.
          </>
        ) : (
          <>
            Questo sito usa <strong>un solo cookie tecnico</strong>, e soltanto nell'area riservata
            per tenere aperta la sessione di chi entra. Niente statistiche, niente profilazione,
            nessun servizio di terzi: non c'è nulla da accettare.
          </>
        )}{' '}
        <Link to="/cookie">Leggi l'informativa</Link>
      </p>

      <div className="site-cookie-actions">
        {scelta ? (
          <>
            <button type="button" className="site-cookie-btn" onClick={() => decidi([])}>
              Rifiuta
            </button>
            <button
              type="button"
              className="site-cookie-btn site-cookie-btn--main"
              onClick={() => decidi(OPZIONALI)}
            >
              Accetta
            </button>
          </>
        ) : (
          <button
            type="button"
            className="site-cookie-btn site-cookie-btn--main"
            onClick={() => decidi([])}
          >
            Ho capito
          </button>
        )}
      </div>
    </div>
  );
}
