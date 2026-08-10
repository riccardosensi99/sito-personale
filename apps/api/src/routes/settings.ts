import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma.js';

export const publicSettingsRouter = Router();

/// Restituisce tutte le chiavi in un unico oggetto: la home fa una sola chiamata.
publicSettingsRouter.get('/', async (_req, res) => {
  const rows = await prisma.setting.findMany();
  const settings = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  res.set('Cache-Control', 'public, max-age=300');
  res.json(settings);
});

export const adminSettingsRouter = Router();

adminSettingsRouter.get('/', async (_req, res) => {
  const rows = await prisma.setting.findMany({ orderBy: { key: 'asc' } });
  res.json(Object.fromEntries(rows.map((r) => [r.key, r.value])));
});

const valueSchema = z.object({ value: z.unknown() });

adminSettingsRouter.put('/:key', async (req, res) => {
  const { value } = valueSchema.parse(req.body);
  const setting = await prisma.setting.upsert({
    where: { key: req.params.key },
    update: { value: value as object },
    create: { key: req.params.key, value: value as object },
  });
  res.json(setting);
});
