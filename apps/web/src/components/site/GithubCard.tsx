import type { GithubStats } from '../../lib/types';

type Props = { stats: GithubStats | null; githubUrl: string };

export function GithubCard({ stats, githubUrl }: Props) {
  return (
    <section>
      <div className="container">
        <div className="github-card reveal">
          <div>
            <div className="section-kicker">GitHub & Open Source</div>
            <h3>Il codice è parte del portfolio.</h3>
            <p>
              Repository, librerie, esperimenti e contributi raccontano meglio di qualsiasi elenco il
              modo in cui lavoro.
            </p>
            <div className="hero-actions">
              <a className="btn btn-primary" href={githubUrl} target="_blank" rel="noreferrer">
                Visita GitHub ↗
              </a>
            </div>
          </div>

          {/* Numeri veri letti dalla GitHub API, in cache lato server per 6 ore. */}
          <div className="gh-stats">
            <div className="gh-stat">
              <strong>{stats?.publicRepos ?? '—'}</strong>
              <span>Repository pubblici</span>
            </div>
            <div className="gh-stat">
              <strong>{stats?.totalStars ?? '—'}</strong>
              <span>Stelle ricevute</span>
            </div>
            <div className="gh-stat">
              <strong>{stats?.followers ?? '—'}</strong>
              <span>Follower</span>
            </div>
            <div className="gh-stat">
              <strong>{stats?.topLanguages.length ?? '—'}</strong>
              <span>Linguaggi usati</span>
            </div>
            {stats && stats.topLanguages.length > 0 && (
              <div className="gh-langs">
                {stats.topLanguages.map((lang) => (
                  <span className="tag" key={lang.name}>
                    {lang.name} · {lang.count}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
