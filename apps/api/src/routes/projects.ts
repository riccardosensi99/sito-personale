import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma.js';
import { uniqueSlug } from '../lib/slug.js';
import { HttpError } from '../middleware/errorHandler.js';

const projectInput = z.object({
  title: z.string().min(2).max(120),
  slug: z.string().min(2).max(80).optional(),
  description: z.string().min(2).max(600),
  body: z.string().max(8000).nullish(),
  categoryLabel: z.string().max(60).optional(),
  badge: z.string().max(40).optional(),
  accentColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, 'Usa un colore esadecimale, es. #00c0af')
    .optional(),
  imageUrl: z.string().max(500).nullish(),
  size: z.enum(['large', 'small']).optional(),
  tags: z.array(z.string().max(30)).max(12).optional(),
  visible: z.boolean().optional(),
  featured: z.boolean().optional(),
  repoUrl: z.string().url().nullish(),
  homepageUrl: z.string().url().nullish(),
});

// ─── Pubblico ────────────────────────────────────────────────────────────────

export const publicProjectsRouter = Router();

publicProjectsRouter.get('/', async (_req, res) => {
  const projects = await prisma.project.findMany({
    where: { visible: true },
    orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
  });
  res.set('Cache-Control', 'public, max-age=300');
  res.json(projects);
});

publicProjectsRouter.get('/:slug', async (req, res) => {
  const project = await prisma.project.findFirst({
    where: { slug: req.params.slug, visible: true },
  });
  if (!project) throw new HttpError(404, 'Progetto non trovato');
  res.set('Cache-Control', 'public, max-age=300');
  res.json(project);
});

// ─── Admin ───────────────────────────────────────────────────────────────────

export const adminProjectsRouter = Router();

adminProjectsRouter.get('/', async (_req, res) => {
  const projects = await prisma.project.findMany({
    orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
  });
  res.json(projects);
});

adminProjectsRouter.post('/', async (req, res) => {
  const data = projectInput.parse(req.body);

  const slug = await uniqueSlug(data.slug || data.title, async (candidate) => {
    return (await prisma.project.count({ where: { slug: candidate } })) > 0;
  });

  // Il nuovo progetto va in fondo alla lista.
  const last = await prisma.project.findFirst({ orderBy: { order: 'desc' }, select: { order: true } });

  const project = await prisma.project.create({
    data: { ...data, slug, order: (last?.order ?? -1) + 1 },
  });

  res.status(201).json(project);
});

adminProjectsRouter.put('/:id', async (req, res) => {
  const data = projectInput.partial().parse(req.body);
  const existing = await prisma.project.findUnique({ where: { id: req.params.id } });
  if (!existing) throw new HttpError(404, 'Progetto non trovato');

  // Lo slug cambia solo se lo chiedi esplicitamente: i link esistenti non si rompono da soli.
  const slug =
    data.slug && data.slug !== existing.slug
      ? await uniqueSlug(data.slug, async (candidate) =>
          (await prisma.project.count({ where: { slug: candidate, NOT: { id: existing.id } } })) > 0,
        )
      : existing.slug;

  const project = await prisma.project.update({
    where: { id: existing.id },
    data: { ...data, slug },
  });

  res.json(project);
});

adminProjectsRouter.delete('/:id', async (req, res) => {
  await prisma.project.delete({ where: { id: req.params.id } }).catch(() => {
    throw new HttpError(404, 'Progetto non trovato');
  });
  res.json({ ok: true });
});

const reorderSchema = z.object({ ids: z.array(z.string()).min(1) });

/// Riceve gli id nell'ordine desiderato e riscrive il campo `order` in un'unica transazione.
adminProjectsRouter.patch('/reorder', async (req, res) => {
  const { ids } = reorderSchema.parse(req.body);
  await prisma.$transaction(
    ids.map((id, index) => prisma.project.update({ where: { id }, data: { order: index } })),
  );
  res.json({ ok: true });
});
