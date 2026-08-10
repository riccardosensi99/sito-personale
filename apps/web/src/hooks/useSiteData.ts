import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { DEFAULT_SETTINGS } from '../lib/defaults';
import type { GithubStats, Project, SiteSettings } from '../lib/types';

type SiteData = {
  projects: Project[];
  settings: SiteSettings;
  stats: GithubStats | null;
  loading: boolean;
  error: string | null;
};

/// Carica in parallelo progetti, contenuti e statistiche GitHub.
/// Se l'API non risponde il sito resta comunque leggibile con i contenuti di default.
export function useSiteData(): SiteData {
  const [projects, setProjects] = useState<Project[]>([]);
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);
  const [stats, setStats] = useState<GithubStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    Promise.allSettled([
      api.get<Project[]>('/projects'),
      api.get<Partial<SiteSettings>>('/settings'),
      api.get<GithubStats>('/github/stats'),
    ])
      .then(([p, s, g]) => {
        if (cancelled) return;

        if (p.status === 'fulfilled') setProjects(p.value);
        else setError('Non riesco a caricare i progetti in questo momento.');

        if (s.status === 'fulfilled') {
          setSettings({ ...DEFAULT_SETTINGS, ...s.value });
        }

        if (g.status === 'fulfilled') setStats(g.value);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { projects, settings, stats, loading, error };
}
