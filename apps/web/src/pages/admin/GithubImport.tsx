import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import type { Project, RepoSummary } from '../../lib/types';

export function GithubImport({ basePath }: { basePath: string }) {
  const navigate = useNavigate();
  const [repos, setRepos] = useState<RepoSummary[]>([]);
  const [query, setQuery] = useState('');
  const [hideForks, setHideForks] = useState(true);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<RepoSummary[]>('/admin/github/repos')
      .then(setRepos)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  // Filtro client-side: la lista completa arriva già in una sola chiamata.
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return repos.filter((repo) => {
      if (hideForks && repo.fork) return false;
      if (!q) return true;
      return (
        repo.name.toLowerCase().includes(q) ||
        (repo.description ?? '').toLowerCase().includes(q) ||
        repo.topics.some((t) => t.includes(q))
      );
    });
  }, [repos, query, hideForks]);

  async function importRepo(repo: RepoSummary) {
    setImporting(repo.githubRepoId);
    setError(null);
    setNotice(null);
    try {
      const project = await api.post<Project>('/admin/github/import', {
        githubRepoId: repo.githubRepoId,
        visible: false,
      });
      setRepos((list) =>
        list.map((r) => (r.githubRepoId === repo.githubRepoId ? { ...r, imported: true } : r)),
      );
      setNotice(`"${repo.name}" importato come bozza. Completa i testi e poi pubblicalo.`);
      navigate(`${basePath}/progetti/${project.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import non riuscito');
    } finally {
      setImporting(null);
    }
  }

  return (
    <>
      <div className="admin-head">
        <div>
          <h1>Importa da GitHub</h1>
          <p>
            L'import crea una bozza nascosta con i dati del repository. Titolo e descrizione restano
            poi tuoi: un refresh aggiorna solo stelle, fork, linguaggio e topics.
          </p>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {notice && <div className="alert alert-ok">{notice}</div>}

      <div className="field-row" style={{ marginBottom: 22 }}>
        <div className="field" style={{ margin: 0 }}>
          <label htmlFor="q">Cerca</label>
          <input
            id="q"
            type="text"
            placeholder="nome, descrizione o topic"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="field" style={{ margin: 0, alignSelf: 'end' }}>
          <label className="checkbox">
            <input
              type="checkbox"
              checked={hideForks}
              onChange={(e) => setHideForks(e.target.checked)}
            />
            Nascondi i fork
          </label>
        </div>
      </div>

      {loading ? (
        <p style={{ color: 'var(--muted)' }}>Leggo i repository…</p>
      ) : visible.length === 0 ? (
        <div className="empty-state">Nessun repository corrisponde ai filtri.</div>
      ) : (
        <div className="repo-grid">
          {visible.map((repo) => (
            <div className="repo-card" key={repo.githubRepoId}>
              <h3>{repo.name}</h3>
              <p>{repo.description ?? 'Nessuna descrizione su GitHub.'}</p>
              <div className="row-meta">
                {repo.language && <span className="pill">{repo.language}</span>}
                <span className="pill">★ {repo.stars}</span>
                {repo.fork && <span className="pill">fork</span>}
                {repo.archived && <span className="pill off">archiviato</span>}
                {repo.pushedAt && (
                  <span className="pill">
                    {new Date(repo.pushedAt).toLocaleDateString('it-IT')}
                  </span>
                )}
              </div>
              <div className="row-actions" style={{ justifyContent: 'flex-start' }}>
                <a
                  className="btn btn-ghost btn-sm"
                  href={repo.repoUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Apri ↗
                </a>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  disabled={repo.imported || importing === repo.githubRepoId}
                  onClick={() => void importRepo(repo)}
                >
                  {repo.imported
                    ? 'Già importato'
                    : importing === repo.githubRepoId
                      ? 'Importo…'
                      : 'Importa'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
