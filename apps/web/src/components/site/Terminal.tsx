import type { TerminalSettings } from '../../lib/types';

type Props = { terminal: TerminalSettings };

/// Il blocco stack.json è generato dai settings: aggiungere una riga non richiede deploy.
export function Terminal({ terminal }: Props) {
  const entries = terminal.stack;

  return (
    <div className="terminal-wrap">
      <div className="orb one" />
      <div className="orb two" />
      <div className="terminal">
        <div className="terminal-bar">
          <span className="dot" />
          <span className="dot" />
          <span className="dot" />
          <span className="terminal-title">{terminal.host}</span>
        </div>
        <div className="terminal-body">
          <div>
            <span className="prompt">❯</span> <span className="command">whoami</span>
          </div>
          <div className="response">Riccardo Sensi — Full Stack Developer</div>
          <br />
          <div>
            <span className="prompt">❯</span> <span className="command">cat stack.json</span>
          </div>
          <div className="response">{'{'}</div>
          {entries.map((row, i) => (
            <div className="response" key={row.key}>
              {`  "${row.key}": [${row.values.map((v) => `"${v}"`).join(', ')}]${
                i < entries.length - 1 ? ',' : ''
              }`}
            </div>
          ))}
          <div className="response">{'}'}</div>
          <br />
          <div>
            <span className="prompt">❯</span> <span className="command">status</span>
          </div>
          <div className="success">● {terminal.status}</div>
          <br />
          <div>
            <span className="prompt">❯</span> <span className="cursor" />
          </div>
        </div>
      </div>
    </div>
  );
}

/// La fascia che ospita il terminale sotto l'hero: prima raccontava se stessa
/// dentro l'hero, ora ha una sua sezione e un titolo che la introduce.
export function TerminalBand({ terminal }: Props) {
  return (
    <section className="terminal-band">
      <div className="container terminal-grid">
        <div className="reveal">
          <div className="section-kicker">Setup</div>
          <h2>
            Lo stack,
            <br />
            senza slide.
          </h2>
          <p className="section-lead">
            Quello che uso davvero tutti i giorni, dal frontend al server. È scritto nei contenuti
            del sito: cambia quando cambia il mio lavoro, non quando ricordo di rifare il deploy.
          </p>
        </div>
        <div className="reveal">
          <Terminal terminal={terminal} />
        </div>
      </div>
    </section>
  );
}
