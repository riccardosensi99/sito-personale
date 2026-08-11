import { ArrowUpRight } from 'lucide-react';
import type { Project } from '../../lib/types';

/**
 * La card di un progetto.
 *
 * Sta in un componente suo e non dentro la home perché la usa anche l'anteprima
 * del backoffice: chi compila il form deve vedere la card vera, non una copia
 * che assomiglia e che prima o poi smette di somigliare.
 */

type Props = { project: Project; index: number };

export function ProjectCard({ project, index }: Props) {
  // Il sito vivo se c'è, altrimenti il codice: è l'ordine con cui li guarda chi
  // sta valutando il lavoro.
  const link = project.homepageUrl || project.repoUrl;

  return (
    <article className="site-project">
      <span className="site-project-num">{String(index + 1).padStart(2, '0')}</span>
      <p className="site-project-type">{project.categoryLabel}</p>
      <h3>
        {link ? (
          <a href={link} target="_blank" rel="noreferrer">
            {project.title}
          </a>
        ) : (
          project.title
        )}
      </h3>
      <p className="site-project-text">{project.description}</p>
      {project.tags.length > 0 && (
        <ul className="site-tags">
          {project.tags.map((tag) => (
            <li key={tag}>{tag}</li>
          ))}
        </ul>
      )}
      {/* La freccia solo dove porta davvero da qualche parte. */}
      {link && (
        <span className="site-project-arrow" aria-hidden="true">
          <ArrowUpRight />
        </span>
      )}
    </article>
  );
}
