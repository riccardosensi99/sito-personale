import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma.js';
import { getProfileStats, getRepoById, listRepos } from '../services/github.js';
import { uniqueSlug } from '../lib/slug.js';
import { HttpError } from '../middleware/errorHandler.js';

// ─── Pubblico ────────────────────────────────────────────────────────────────

export const publicGithubRouter = Router();

publicGithubRouter.get('/stats', async (_req, res) => {
  const stats = await getProfileStats();
  res.set('Cache-Control', 'public, max-age=1800');
  res.json(stats);
});

// ─── Admin ───────────────────────────────────────────────────────────────────

export const adminGithubRouter = Router();

adminGithubRouter.get('/repos', async (req, res) => {
  const q = typeof req.query.q === 'string' ? req.query.q : undefined;
  res.json(await listRepos(q));
});

const importSchema = z.object({
  githubRepoId: z.number().int().positive(),
  visible: z.boolean().default(false),
  size: z.enum(['large', 'small']).default('large'),
  accentColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .default('#00c0af'),
});

adminGithubRouter.post('/import', async (req, res) => {
  const input = importSchema.parse(req.body);

  const already = await prisma.project.findUnique({
    where: { githubRepoId: input.githubRepoId },
  });
  if (already) throw new HttpError(409, 'Questo repository è già stato importato');

  const repo = await getRepoById(input.githubRepoId);

  const slug = await uniqueSlug(
    repo.name,
    async (candidate) => (await prisma.project.count({ where: { slug: candidate } })) > 0,
  );
  const last = await prisma.project.findFirst({
    orderBy: { order: 'desc' },
    select: { order: true },
  });

  // I campi editoriali partono dai dati GitHub ma da qui in poi vivono di vita propria:
  // il refresh successivo non li toccherà più.
  const project = await prisma.project.create({
    data: {
      slug,
      title: repo.name.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      description: repo.description ?? 'Descrizione da scrivere.',
      categoryLabel: repo.language ?? 'Progetto',
      badge: repo.language ?? 'Code',
      accentColor: input.accentColor,
      size: input.size,
      tags: repo.topics.slice(0, 6),
      visible: input.visible,
      order: (last?.order ?? -1) + 1,
      githubRepoId: repo.githubRepoId,
      repoUrl: repo.repoUrl,
      homepageUrl: repo.homepageUrl,
      stars: repo.stars,
      forks: repo.forks,
      language: repo.language,
      topics: repo.topics,
      pushedAt: repo.pushedAt ? new Date(repo.pushedAt) : null,
      lastSyncedAt: new Date(),
    },
  });

  res.status(201).json(project);
});

/// Riallinea i soli metadati GitHub (stelle, fork, linguaggio, topics, pushedAt).
adminGithubRouter.post('/refresh/:id', async (req, res) => {
  const project = await prisma.project.findUnique({ where: { id: req.params.id } });
  if (!project) throw new HttpError(404, 'Progetto non trovato');
  if (!project.githubRepoId) throw new HttpError(400, 'Questo progetto non è legato a un repository');

  const repo = await getRepoById(project.githubRepoId);

  const updated = await prisma.project.update({
    where: { id: project.id },
    data: {
      repoUrl: repo.repoUrl,
      homepageUrl: repo.homepageUrl,
      stars: repo.stars,
      forks: repo.forks,
      language: repo.language,
      topics: repo.topics,
      pushedAt: repo.pushedAt ? new Date(repo.pushedAt) : null,
      lastSyncedAt: new Date(),
    },
  });

  res.json(updated);
});

adminGithubRouter.post('/refresh-stats', async (_req, res) => {
  await prisma.githubStats.updateMany({ data: { fetchedAt: new Date(0) } });
  res.json(await getProfileStats());
});
