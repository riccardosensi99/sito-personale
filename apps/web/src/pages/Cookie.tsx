import { useEffect } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSeo } from '../lib/seo';
import '../styles/site.css';

/**
 * Informativa sui cookie.
 *
 * Elenca ciò che il sito imposta davvero, uno solo, con nome, scopo e durata
 * presi dal codice che lo emette (services/token.ts). Se quel codice cambia —
 * altro nome, altra durata, un secondo cookie — questa pagina va aggiornata
 * insieme, altrimenti diventa una dichiarazione falsa.
 */

const COOKIE = [
  {
    nome: 'rs_session',
    tipo: 'Tecnico',
    scopo:
      'Tiene aperta la sessione di chi accede all’area riservata. Viene emesso solo dopo il secondo fattore e non esiste per chi visita il sito pubblico.',
    durata: '8 ore, o fino all’uscita',
    parte: 'Prima parte (questo sito)',
  },
];

export default function Cookie() {
  useSeo({
    titolo: 'Cookie — Riccardo Sensi',
    descrizione:
      'Quali cookie usa questo sito, a cosa servono e come cancellarli: uno solo, tecnico, nessuna statistica e nessuna profilazione.',
    path: '/cookie',
  });

  useEffect(() => {
    document.documentElement.classList.add('site-mode');
    return () => document.documentElement.classList.remove('site-mode');
  }, []);

  return (
    <div className="site">
      <div className="site-doc">
        <Link className="site-doc-back" to="/">
          ← Torna al sito
        </Link>

        <p className="site-kicker">Informativa</p>
        <h1 className="site-h2 site-h2--big">Cookie</h1>

        <p className="site-lead">
          Questo sito usa un solo cookie, ed è tecnico: serve a far funzionare l’accesso all’area
          riservata. Non ci sono cookie di statistica, di profilazione o di terze parti, e nessun
          servizio esterno viene caricato dalle pagine pubbliche.
        </p>
        <p className="site-lead">
          Per i cookie tecnici la normativa non richiede consenso, perché senza di essi il servizio
          richiesto non può essere fornito. Richiede però che siano dichiarati: è quello che fa
          questa pagina.
        </p>

        <h2 className="site-doc-h3">Cosa viene impostato</h2>

        <div className="site-doc-table" role="table">
          {COOKIE.map((c) => (
            <div className="site-doc-row" role="row" key={c.nome}>
              <div>
                <strong>{c.nome}</strong>
                <span className="site-doc-tag">{c.tipo}</span>
              </div>
              <p>{c.scopo}</p>
              <dl>
                <div>
                  <dt>Durata</dt>
                  <dd>{c.durata}</dd>
                </div>
                <div>
                  <dt>Titolare</dt>
                  <dd>{c.parte}</dd>
                </div>
              </dl>
            </div>
          ))}
        </div>

        <h2 className="site-doc-h3">Come cancellarlo</h2>
        <p className="site-lead">
          Uscendo dall’area riservata il cookie viene rimosso dal server. In alternativa si può
          cancellare dalle impostazioni del browser, alla voce dati dei siti: è un’operazione che
          non pregiudica la consultazione del sito pubblico.
        </p>

        <h2 className="site-doc-h3">Se le cose cambiano</h2>
        <p className="site-lead">
          Se un domani venissero aggiunti strumenti di statistica o contenuti incorporati da altri
          siti, comparirebbe una richiesta di consenso preventiva, con il rifiuto altrettanto
          semplice dell’accettazione, e questa pagina verrebbe aggiornata di conseguenza.
        </p>

        <h2 className="site-doc-h3">Titolare</h2>
        <p className="site-lead">
          Riccardo Sensi — P. IVA 04030250544.
          <br />
          <a className="site-doc-mail" href="mailto:riccardosensi57@gmail.com">
            riccardosensi57@gmail.com <ArrowUpRight aria-hidden="true" />
          </a>
        </p>
      </div>
    </div>
  );
}
