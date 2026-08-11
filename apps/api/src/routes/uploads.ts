import { Router } from 'express';
import multer from 'multer';
import { randomBytes } from 'node:crypto';
import path from 'node:path';
import { mkdirSync } from 'node:fs';
import { env } from '../env.js';
import { HttpError } from '../middleware/errorHandler.js';

mkdirSync(env.UPLOAD_DIR, { recursive: true });

const ALLOWED = new Map([
  ['image/png', '.png'],
  ['image/jpeg', '.jpg'],
  ['image/webp', '.webp'],
  ['image/avif', '.avif'],
  ['image/svg+xml', '.svg'],
  // Il CV: stesso canale delle immagini, stesso volume, stesso nome generato
  // dal server. È l'unico non-immagine ammesso.
  ['application/pdf', '.pdf'],
]);

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, env.UPLOAD_DIR),
    // Nome generato dal server: niente path traversal e niente collisioni.
    filename: (_req, file, cb) => {
      const ext = ALLOWED.get(file.mimetype) ?? '.bin';
      cb(null, `${Date.now()}-${randomBytes(6).toString('hex')}${ext}`);
    },
  }),
  limits: { fileSize: 4 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED.has(file.mimetype)) {
      cb(new HttpError(400, 'Formato non supportato: usa png, jpg, webp, avif, svg o pdf'));
      return;
    }
    cb(null, true);
  },
});

export const uploadsRouter = Router();

uploadsRouter.post('/', upload.single('file'), (req, res) => {
  if (!req.file) throw new HttpError(400, 'Nessun file caricato');
  res.status(201).json({
    url: `/uploads/${path.basename(req.file.filename)}`,
    size: req.file.size,
  });
});
