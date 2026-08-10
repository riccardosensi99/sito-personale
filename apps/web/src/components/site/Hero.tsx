import { Terminal } from './Terminal';
import type { HeroSettings, TerminalSettings } from '../../lib/types';

type Props = { hero: HeroSettings; terminal: TerminalSettings; githubUrl: string };

export function Hero({ hero, terminal, githubUrl }: Props) {
  return (
    <section className="hero">
      <div className="container hero-grid">
        <div>
          {hero.available && (
            <div className="eyebrow">
              <span className="eyebrow-dot" /> {hero.availableLabel}
            </div>
          )}
          <h1>
            {hero.titleLead} <span className="gradient-text">{hero.titleAccent}</span>
          </h1>
          <p className="hero-copy">{hero.copy}</p>
          <div className="hero-actions">
            <a className="btn btn-primary" href="#projects">
              Esplora i progetti ↘
            </a>
            <a className="btn btn-secondary" href={githubUrl} target="_blank" rel="noreferrer">
              GitHub ↗
            </a>
          </div>
          <div className="hero-meta">
            {hero.highlights.map((h) => (
              <div key={h.title}>
                <strong>{h.title}</strong>
                {h.text}
              </div>
            ))}
          </div>
        </div>

        <Terminal terminal={terminal} />
      </div>
    </section>
  );
}
