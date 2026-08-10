import { AlertTriangle } from 'lucide-react';
import { ProjectRail } from './ProjectRail';
import type { Project } from '../../lib/types';

type Props = { projects: Project[]; loading: boolean; error: string | null };

export function Projects({ projects, loading, error }: Props) {
  return (
    <section id="projects">
      <div className="container">
        <div className="section-heading reveal">
          <div>
            <div className="section-kicker">Selected work</div>
            <h2>
              Progetti costruiti
              <br />
              per essere usati.
            </h2>
          </div>
          <p>
            Una selezione di piattaforme, dashboard e prodotti che uniscono frontend, backend, dati e
            automazioni.
          </p>
        </div>

        {error && (
          <div className="load-error" role="status">
            <AlertTriangle aria-hidden="true" />
            {error}
          </div>
        )}
      </div>

      {!loading && projects.length === 0 ? (
        <div className="container">
          <div className="empty-state">
            Nessun progetto pubblicato al momento. Torna a trovarmi tra poco.
          </div>
        </div>
      ) : (
        <ProjectRail projects={projects} loading={loading} />
      )}
    </section>
  );
}
