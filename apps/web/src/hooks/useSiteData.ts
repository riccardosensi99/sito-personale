import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { DEFAULT_SETTINGS } from '../lib/defaults';
import type { Project, SiteSettings } from '../lib/types';

/// Merge a due livelli: i blocchi salvati a database vincono, ma un campo aggiunto
/// dopo il seed (il DB è create-only) arriva comunque dai default invece di essere
/// `undefined`. Gli array restano quelli del database: sono liste, non patch.
function mergeSettings(saved: Partial<SiteSettings>): SiteSettings {
  const merged = { ...DEFAULT_SETTINGS } as Record<string, unknown>;

  for (const [key, value] of Object.entries(saved)) {
    const fallback = merged[key];
    const mergeable =
      value !== null &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      fallback !== null &&
      typeof fallback === 'object' &&
      !Array.isArray(fallback);

    merged[key] = mergeable ? { ...(fallback as object), ...(value as object) } : value;
  }

  return merged as SiteSettings;
}

type SiteData = {
  projects: Project[];
  settings: SiteSettings;
  loading: boolean;
  error: string | null;
};

/// Carica in parallelo i progetti e i contenuti.
/// Se l'API non risponde il sito resta comunque leggibile con i contenuti di default.
export function useSiteData(): SiteData {
  const [projects, setProjects] = useState<Project[]>([]);
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    Promise.allSettled([
      api.get<Project[]>('/projects'),
      api.get<Partial<SiteSettings>>('/settings'),
    ])
      .then(([p, s]) => {
        if (cancelled) return;

        if (p.status === 'fulfilled') setProjects(p.value);
        else setError('Non riesco a caricare i progetti in questo momento.');

        if (s.status === 'fulfilled') setSettings(mergeSettings(s.value));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { projects, settings, loading, error };
}
