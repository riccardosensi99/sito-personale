import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../lib/api';
import { ProjectCard } from '../../components/site/ProjectCard';
import type { Project } from '../../lib/types';

type FormState = {
  title: string;
  slug: string;
  description: string;
  body: string;
  categoryLabel: string;
  badge: string;
  accentColor: string;
  imageUrl: string;
  size: 'large' | 'small';
  tags: string;
  repoUrl: string;
  homepageUrl: string;
  visible: boolean;
  featured: boolean;
};

const EMPTY: FormState = {
  title: '',
  slug: '',
  description: '',
  body: '',
  categoryLabel: 'Progetto',
  badge: 'Full Stack',
  accentColor: '#00c0af',
  imageUrl: '',
  size: 'large',
  tags: '',
  repoUrl: '',
  homepageUrl: '',
  visible: true,
  featured: false,
};

export function ProjectForm({ basePath }: { basePath: string }) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState<FormState>(EMPTY);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    api
      .get<Project[]>('/admin/projects')
      .then((all) => {
        const project = all.find((p) => p.id === id);
        if (!project) {
          setError('Progetto non trovato');
          return;
        }
        setForm({
          title: project.title,
          slug: project.slug,
          description: project.description,
          body: project.body ?? '',
          categoryLabel: project.categoryLabel,
          badge: project.badge,
          accentColor: project.accentColor,
          imageUrl: project.imageUrl ?? '',
          size: project.size,
          tags: project.tags.join(', '),
          repoUrl: project.repoUrl ?? '',
          homepageUrl: project.homepageUrl ?? '',
          visible: project.visible,
          featured: project.featured,
        });
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function uploadImage(file: File) {
    setUploading(true);
    setError(null);
    try {
      const res = await api.upload<{ url: string }>('/admin/uploads', file);
      set('imageUrl', res.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload non riuscito');
    } finally {
      setUploading(false);
    }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload = {
      title: form.title,
      slug: form.slug || undefined,
      description: form.description,
      body: form.body || null,
      categoryLabel: form.categoryLabel,
      badge: form.badge,
      accentColor: form.accentColor,
      imageUrl: form.imageUrl || null,
      size: form.size,
      tags: form.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      repoUrl: form.repoUrl || null,
      homepageUrl: form.homepageUrl || null,
      visible: form.visible,
      featured: form.featured,
    };

    try {
      if (isEdit) await api.put(`/admin/projects/${id}`, payload);
      else await api.post('/admin/projects', payload);
      navigate(basePath);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Salvataggio non riuscito');
      setSaving(false);
    }
  }

  if (loading) return <p style={{ color: 'var(--muted)' }}>Carico…</p>;

  // Anteprima: la stessa card che finisce in home, così vedi subito il risultato.
  const preview: Project = {
    id: 'preview',
    slug: form.slug || 'anteprima',
    title: form.title || 'Titolo del progetto',
    description: form.description || 'La descrizione che leggeranno i visitatori.',
    body: null,
    categoryLabel: form.categoryLabel || 'Progetto',
    badge: form.badge || 'Badge',
    accentColor: form.accentColor,
    imageUrl: form.imageUrl || null,
    size: form.size,
    tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
    order: 0,
    visible: form.visible,
    featured: form.featured,
    githubRepoId: null,
    repoUrl: form.repoUrl || null,
    homepageUrl: form.homepageUrl || null,
    stars: 0,
    forks: 0,
    language: null,
    topics: [],
    pushedAt: null,
    lastSyncedAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return (
    <>
      <div className="admin-head">
        <div>
          <h1>{isEdit ? 'Modifica progetto' : 'Nuovo progetto'}</h1>
          <p>I campi qui sotto sono quelli mostrati nella card in home page.</p>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="form-layout">
        <form onSubmit={(e) => void save(e)}>
          <div className="field">
            <label htmlFor="title">Titolo</label>
            <input
              id="title"
              type="text"
              required
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="description">Descrizione</label>
            <textarea
              id="description"
              required
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
            />
          </div>

          <div className="field-row">
            <div className="field">
              <label htmlFor="categoryLabel">Etichetta categoria</label>
              <input
                id="categoryLabel"
                type="text"
                value={form.categoryLabel}
                onChange={(e) => set('categoryLabel', e.target.value)}
              />
              <span className="hint">Appare come "01 / Gestionale"</span>
            </div>
            <div className="field">
              <label htmlFor="badge">Badge</label>
              <input
                id="badge"
                type="text"
                value={form.badge}
                onChange={(e) => set('badge', e.target.value)}
              />
            </div>
          </div>

          <div className="field-row">
            <div className="field">
              <label htmlFor="size">Larghezza card</label>
              <select
                id="size"
                value={form.size}
                onChange={(e) => set('size', e.target.value as 'large' | 'small')}
              >
                <option value="large">Larga (7 colonne)</option>
                <option value="small">Stretta (5 colonne)</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="accentColor">Colore d'accento</label>
              <div style={{ display: 'flex', gap: 10 }}>
                <input
                  id="accentColor"
                  type="color"
                  value={form.accentColor}
                  onChange={(e) => set('accentColor', e.target.value)}
                />
                <input
                  type="text"
                  value={form.accentColor}
                  onChange={(e) => set('accentColor', e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="field">
            <label htmlFor="tags">Tag</label>
            <input
              id="tags"
              type="text"
              value={form.tags}
              onChange={(e) => set('tags', e.target.value)}
            />
            <span className="hint">Separati da virgola, es. React, Prisma, Docker</span>
          </div>

          <div className="field-row">
            <div className="field">
              <label htmlFor="repoUrl">URL repository</label>
              <input
                id="repoUrl"
                type="url"
                value={form.repoUrl}
                onChange={(e) => set('repoUrl', e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="homepageUrl">URL live</label>
              <input
                id="homepageUrl"
                type="url"
                value={form.homepageUrl}
                onChange={(e) => set('homepageUrl', e.target.value)}
              />
            </div>
          </div>

          <div className="field">
            <label htmlFor="image">Immagine di anteprima</label>
            <input
              id="image"
              type="file"
              accept="image/png,image/jpeg,image/webp,image/avif,image/svg+xml"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void uploadImage(file);
              }}
            />
            <span className="hint">
              {uploading
                ? 'Carico…'
                : form.imageUrl
                  ? `Attuale: ${form.imageUrl}`
                  : 'Senza immagine resta il mockup astratto del design.'}
            </span>
            {form.imageUrl && (
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                style={{ justifySelf: 'start' }}
                onClick={() => set('imageUrl', '')}
              >
                Rimuovi immagine
              </button>
            )}
          </div>

          <div className="field">
            <label htmlFor="body">Testo lungo (opzionale)</label>
            <textarea id="body" value={form.body} onChange={(e) => set('body', e.target.value)} />
          </div>

          {isEdit && (
            <div className="field">
              <label htmlFor="slug">Slug</label>
              <input
                id="slug"
                type="text"
                value={form.slug}
                onChange={(e) => set('slug', e.target.value)}
              />
              <span className="hint">Cambiarlo rompe eventuali link già condivisi.</span>
            </div>
          )}

          <div className="field">
            <label className="checkbox">
              <input
                type="checkbox"
                checked={form.visible}
                onChange={(e) => set('visible', e.target.checked)}
              />
              Visibile sul sito pubblico
            </label>
            <label className="checkbox">
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(e) => set('featured', e.target.checked)}
              />
              In evidenza
            </label>
          </div>

          <div className="btn-row">
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Salvo…' : isEdit ? 'Salva modifiche' : 'Crea progetto'}
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => navigate(basePath)}>
              Annulla
            </button>
          </div>
        </form>

        <div className="form-preview">
          <div className="preview-kicker">Anteprima</div>
          {/* `site` porta con sé i token del sito: la card è la stessa del sito
              vero, e qui dentro deve trovare i colori e i caratteri di là, non
              quelli del backoffice. */}
          <div className="site">
            <ProjectCard project={preview} index={0} />
          </div>
        </div>
      </div>
    </>
  );
}
