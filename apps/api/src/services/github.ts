import { Octokit } from '@octokit/rest';
import { env } from '../env.js';
import { prisma } from '../prisma.js';

const octokit = new Octokit({
  auth: env.GITHUB_TOKEN || undefined,
  userAgent: 'riccardosensi.com',
});

export type RepoSummary = {
  githubRepoId: number;
  name: string;
  fullName: string;
  description: string | null;
  repoUrl: string;
  homepageUrl: string | null;
  stars: number;
  forks: number;
  language: string | null;
  topics: string[];
  pushedAt: string | null;
  fork: boolean;
  archived: boolean;
  /// true se un progetto con questo repo è già stato importato.
  imported?: boolean;
};

function toSummary(repo: {
  id: number;
  name: string;
  full_name: string;
  description?: string | null;
  html_url: string;
  homepage?: string | null;
  stargazers_count?: number;
  forks_count?: number;
  language?: string | null;
  topics?: string[];
  pushed_at?: string | null;
  fork?: boolean;
  archived?: boolean;
}): RepoSummary {
  return {
    githubRepoId: repo.id,
    name: repo.name,
    fullName: repo.full_name,
    description: repo.description ?? null,
    repoUrl: repo.html_url,
    homepageUrl: repo.homepage || null,
    stars: repo.stargazers_count ?? 0,
    forks: repo.forks_count ?? 0,
    language: repo.language ?? null,
    topics: repo.topics ?? [],
    pushedAt: repo.pushed_at ?? null,
    fork: repo.fork ?? false,
    archived: repo.archived ?? false,
  };
}

/// Elenca i repo dell'utente. Con un token vede anche i privati, senza solo i pubblici.
export async function listRepos(query?: string): Promise<RepoSummary[]> {
  const repos = env.GITHUB_TOKEN
    ? await octokit.paginate(octokit.repos.listForAuthenticatedUser, {
        per_page: 100,
        sort: 'pushed',
        affiliation: 'owner',
      })
    : await octokit.paginate(octokit.repos.listForUser, {
        username: env.GITHUB_USERNAME,
        per_page: 100,
        sort: 'pushed',
      });

  const imported = await prisma.project.findMany({
    where: { githubRepoId: { not: null } },
    select: { githubRepoId: true },
  });
  const importedIds = new Set(imported.map((p) => p.githubRepoId));

  const q = query?.trim().toLowerCase();

  return repos
    .map(toSummary)
    .filter((r) => !q || r.name.toLowerCase().includes(q) || (r.description ?? '').toLowerCase().includes(q))
    .map((r) => ({ ...r, imported: importedIds.has(r.githubRepoId) }))
    .sort((a, b) => (b.pushedAt ?? '').localeCompare(a.pushedAt ?? ''));
}

export async function getRepoById(githubRepoId: number): Promise<RepoSummary> {
  const { data } = await octokit.request('GET /repositories/{id}', { id: githubRepoId });
  return toSummary(data as Parameters<typeof toSummary>[0]);
}

/// Statistiche del profilo, aggiornate al massimo ogni 6 ore.
const STATS_TTL_MS = 6 * 60 * 60 * 1000;

export async function getProfileStats() {
  const cached = await prisma.githubStats.findUnique({ where: { id: 1 } });
  if (cached && Date.now() - cached.fetchedAt.getTime() < STATS_TTL_MS) return cached;

  try {
    const { data: user } = await octokit.users.getByUsername({ username: env.GITHUB_USERNAME });
    const repos = await octokit.paginate(octokit.repos.listForUser, {
      username: env.GITHUB_USERNAME,
      per_page: 100,
    });

    const totalStars = repos.reduce((sum, r) => sum + (r.stargazers_count ?? 0), 0);

    const byLanguage = new Map<string, number>();
    for (const repo of repos) {
      if (!repo.language) continue;
      byLanguage.set(repo.language, (byLanguage.get(repo.language) ?? 0) + 1);
    }
    const topLanguages = [...byLanguage.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    const payload = {
      publicRepos: user.public_repos ?? repos.length,
      totalStars,
      followers: user.followers ?? 0,
      topLanguages,
      fetchedAt: new Date(),
    };

    return await prisma.githubStats.upsert({
      where: { id: 1 },
      update: payload,
      create: { id: 1, ...payload },
    });
  } catch (err) {
    // Rate limit o GitHub giù: meglio servire dati vecchi che rompere la home.
    console.warn('GitHub stats non aggiornate:', err instanceof Error ? err.message : err);
    if (cached) return cached;
    return {
      id: 1,
      publicRepos: 0,
      totalStars: 0,
      followers: 0,
      topLanguages: [],
      fetchedAt: new Date(0),
    };
  }
}
