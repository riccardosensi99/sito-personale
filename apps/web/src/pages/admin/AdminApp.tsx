import { useCallback, useEffect, useState } from 'react';
import { Navigate, NavLink, Route, Routes, useNavigate } from 'react-router-dom';
import { api, ApiError } from '../../lib/api';
import { Login } from './Login';
import { Dashboard } from './Dashboard';
import { ProjectForm } from './ProjectForm';
import { GithubImport } from './GithubImport';
import { SettingsEditor } from './SettingsEditor';
import '../../styles/admin.css';

type Me = { email: string; lastLoginAt: string | null };

export default function AdminApp({ basePath }: { basePath: string }) {
  const [me, setMe] = useState<Me | null>(null);
  const [checking, setChecking] = useState(true);

  const refreshMe = useCallback(async () => {
    try {
      setMe(await api.get<Me>('/admin/auth/me'));
    } catch (err) {
      if (!(err instanceof ApiError && err.status === 401)) console.error(err);
      setMe(null);
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    // Il backoffice non è indicizzabile nemmeno se il path segreto trapela.
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex,nofollow';
    document.head.appendChild(meta);
    const previousTitle = document.title;
    document.title = 'Backoffice';

    void refreshMe();

    return () => {
      meta.remove();
      document.title = previousTitle;
    };
  }, [refreshMe]);

  if (checking) return <div className="admin-boot">Verifico la sessione…</div>;
  if (!me) return <Login onAuthenticated={refreshMe} />;

  return <AdminShell me={me} basePath={basePath} onLogout={() => setMe(null)} />;
}

function AdminShell({
  me,
  basePath,
  onLogout,
}: {
  me: Me;
  basePath: string;
  onLogout: () => void;
}) {
  const navigate = useNavigate();

  async function logout() {
    await api.post('/admin/auth/logout').catch(() => undefined);
    onLogout();
    navigate(basePath, { replace: true });
  }

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <a className="brand" href="/">
          <span className="brand-mark">RS</span>
          <span>Backoffice</span>
        </a>

        <nav className="admin-nav">
          <NavLink to={basePath} end>
            Progetti
          </NavLink>
          <NavLink to={`${basePath}/nuovo`}>Nuovo progetto</NavLink>
          <NavLink to={`${basePath}/github`}>Importa da GitHub</NavLink>
          <NavLink to={`${basePath}/contenuti`}>Contenuti sito</NavLink>
        </nav>

        <div className="admin-user">
          <div>
            {me.email}
            {me.lastLoginAt && (
              <>
                <br />
                <span style={{ opacity: 0.7 }}>
                  ultimo accesso {new Date(me.lastLoginAt).toLocaleString('it-IT')}
                </span>
              </>
            )}
          </div>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => void logout()}>
            Esci
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <Routes>
          <Route index element={<Dashboard basePath={basePath} />} />
          <Route path="nuovo" element={<ProjectForm basePath={basePath} />} />
          <Route path="progetti/:id" element={<ProjectForm basePath={basePath} />} />
          <Route path="github" element={<GithubImport basePath={basePath} />} />
          <Route path="contenuti" element={<SettingsEditor />} />
          <Route path="*" element={<Navigate to={basePath} replace />} />
        </Routes>
      </main>
    </div>
  );
}
