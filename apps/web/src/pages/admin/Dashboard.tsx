import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import type { Project } from '../../lib/types';

export function Dashboard({ basePath }: { basePath: string }) {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<Project[]>('/admin/projects')
      .then(setProjects)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  async function persistOrder(ordered: Project[]) {
    const previous = projects;
    setProjects(ordered);
    try {
      await api.patch('/admin/projects/reorder', { ids: ordered.map((p) => p.id) });
      setNotice('Ordine aggiornato.');
    } catch (err) {
      setProjects(previous);
      setError(err instanceof Error ? err.message : 'Riordino non riuscito');
    }
  }

  function handleDrop(targetId: string) {
    setOverId(null);
    if (!dragId || dragId === targetId) return;

    const from = projects.findIndex((p) => p.id === dragId);
    const to = projects.findIndex((p) => p.id === targetId);
    if (from < 0 || to < 0) return;

    const next = [...projects];
    const [moved] = next.splice(from, 1);
    if (moved) next.splice(to, 0, moved);
    void persistOrder(next);
  }

  /// Alternativa da tastiera al drag & drop.
  function move(id: string, delta: number) {
    const index = projects.findIndex((p) => p.id === id);
    const target = index + delta;
    if (index < 0 || target < 0 || target >= projects.length) return;

    const next = [...projects];
    const [moved] = next.splice(index, 1);
    if (moved) next.splice(target, 0, moved);
    void persistOrder(next);
  }

  async function toggleVisible(project: Project) {
    try {
      const updated = await api.put<Project>(`/admin/projects/${project.id}`, {
        visible: !project.visible,
      });
      setProjects((list) => list.map((p) => (p.id === updated.id ? updated : p)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Aggiornamento non riuscito');
    }
  }

  async function refreshFromGithub(project: Project) {
    setNotice(null);
    try {
      const updated = await api.post<Project>(`/admin/github/refresh/${project.id}`);
      setProjects((list) => list.map((p) => (p.id === updated.id ? updated : p)));
      setNotice(`Dati GitHub di "${updated.title}" aggiornati.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Refresh non riuscito');
    }
  }

  async function remove(project: Project) {
    if (!window.confirm(`Elimino "${project.title}"? L'operazione non è reversibile.`)) return;
    try {
      await api.del(`/admin/projects/${project.id}`);
      setProjects((list) => list.filter((p) => p.id !== project.id));
      setNotice('Progetto eliminato.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Eliminazione non riuscita');
    }
  }

  return (
    <>
      <div className="admin-head">
        <div>
          <h1>Progetti</h1>
          <p>
            Trascina le righe per cambiare l'ordine in home. I progetti nascosti non compaiono sul
            sito pubblico.
          </p>
        </div>
        <div className="btn-row" style={{ marginTop: 0 }}>
          <Link className="btn btn-secondary btn-sm" to={`${basePath}/github`}>
            Importa da GitHub
          </Link>
          <Link className="btn btn-primary btn-sm" to={`${basePath}/nuovo`}>
            Nuovo progetto
          </Link>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {notice && <div className="alert alert-ok">{notice}</div>}

      {loading ? (
        <p style={{ color: 'var(--muted)' }}>Carico…</p>
      ) : projects.length === 0 ? (
        <div className="empty-state">
          Nessun progetto. Importane uno da GitHub o creane uno da zero.
        </div>
      ) : (
        <div className="admin-list">
          {projects.map((project, i) => (
            <div
              key={project.id}
              className={`admin-row ${dragId === project.id ? 'dragging' : ''} ${
                overId === project.id ? 'drop-target' : ''
              }`}
              draggable
              onDragStart={() => setDragId(project.id)}
              onDragEnd={() => {
                setDragId(null);
                setOverId(null);
              }}
              onDragOver={(e) => {
                e.preventDefault();
                setOverId(project.id);
              }}
              onDrop={() => handleDrop(project.id)}
            >
              <div className="drag-handle" title="Trascina per riordinare">
                ⠿
              </div>

              <div>
                <h3>
                  <span className="dot-accent" style={{ background: project.accentColor }} />
                  {project.title}
                </h3>
                <p>{project.description}</p>
                <div className="row-meta">
                  <span className={`pill ${project.visible ? 'on' : 'off'}`}>
                    {project.visible ? 'pubblico' : 'nascosto'}
                  </span>
                  <span className="pill">{project.size}</span>
                  <span className="pill">#{i + 1}</span>
                  {project.githubRepoId && <span className="pill">★ {project.stars}</span>}
                  {project.language && <span className="pill">{project.language}</span>}
                </div>
              </div>

              <div className="row-actions">
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => move(project.id, -1)}
                  disabled={i === 0}
                  aria-label={`Sposta ${project.title} in alto`}
                >
                  ↑
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => move(project.id, 1)}
                  disabled={i === projects.length - 1}
                  aria-label={`Sposta ${project.title} in basso`}
                >
                  ↓
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => void toggleVisible(project)}
                >
                  {project.visible ? 'Nascondi' : 'Pubblica'}
                </button>
                {project.githubRepoId && (
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => void refreshFromGithub(project)}
                  >
                    Refresh
                  </button>
                )}
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => navigate(`${basePath}/progetti/${project.id}`)}
                >
                  Modifica
                </button>
                <button
                  type="button"
                  className="btn btn-danger btn-sm"
                  onClick={() => void remove(project)}
                >
                  Elimina
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
