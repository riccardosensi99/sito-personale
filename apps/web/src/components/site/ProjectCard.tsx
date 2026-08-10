import type { CSSProperties } from 'react';
import { ArrowUpRight, Code2, Star } from 'lucide-react';
import type { Project } from '../../lib/types';

type Props = { project: Project; index: number };

export function ProjectCard({ project, index }: Props) {
  const style = { '--project-accent': project.accentColor } as CSSProperties;
  const isWide = project.size === 'large';

  return (
    <article className={`project-card ${project.size} reveal`} style={style}>
      <div className="project-top">
        <span className="project-index">
          {String(index + 1).padStart(2, '0')} / {project.categoryLabel}
        </span>
        <span className="project-badge">{project.badge}</span>
      </div>

      <h3>{project.title}</h3>
      <p>{project.description}</p>

      {project.tags.length > 0 && (
        <div className="tags">
          {project.tags.map((tag) => (
            <span className="tag" key={tag}>
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="project-links">
        {project.repoUrl && (
          <a href={project.repoUrl} target="_blank" rel="noreferrer">
            Codice <ArrowUpRight aria-hidden="true" />
          </a>
        )}
        {project.homepageUrl && (
          <a href={project.homepageUrl} target="_blank" rel="noreferrer">
            Live <ArrowUpRight aria-hidden="true" />
          </a>
        )}
        {project.stars > 0 && (
          <span className="project-stat">
            <Star aria-hidden="true" /> {project.stars}
            <span className="sr-only">stelle su GitHub</span>
          </span>
        )}
        {project.language && (
          <span className="project-stat">
            <Code2 aria-hidden="true" /> {project.language}
          </span>
        )}
      </div>

      <div className="project-preview">
        <div className="project-preview-inner">
          {project.imageUrl ? (
            <img src={project.imageUrl} alt={`Anteprima di ${project.title}`} loading="lazy" />
          ) : (
            // Nessuno screenshot caricato: resta il mockup astratto del design originale.
            <div
              className="preview-window"
              style={isWide ? undefined : { gridTemplateColumns: '1fr' }}
            >
              {isWide && <div className="preview-sidebar" />}
              <div className="preview-content">
                <div />
                <div />
                <div />
              </div>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

export function ProjectCardSkeleton({ size }: { size: 'large' | 'small' }) {
  return (
    <article className={`project-card ${size} is-skeleton`} aria-hidden="true">
      <div className="skeleton skeleton-line short" />
      <div className="skeleton skeleton-line title" />
      <div className="skeleton skeleton-line" />
      <div className="skeleton skeleton-line" />
      <div className="skeleton skeleton-line short" />
      <div className="project-preview">
        <div className="skeleton project-preview-inner" />
      </div>
    </article>
  );
}
