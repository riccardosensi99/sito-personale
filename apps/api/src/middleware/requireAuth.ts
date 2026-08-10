import type { NextFunction, Request, Response } from 'express';
import { prisma } from '../prisma.js';
import { SESSION_COOKIE, verifySession } from '../services/token.js';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const token = req.cookies?.[SESSION_COOKIE];
  if (typeof token !== 'string') {
    res.status(401).json({ error: 'Non autenticato' });
    return;
  }

  const payload = verifySession(token);
  if (!payload) {
    res.status(401).json({ error: 'Sessione non valida' });
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: { id: true, tokenVersion: true },
  });

  // tokenVersion diversa = sessione revocata lato server, il JWT non basta più.
  if (!user || user.tokenVersion !== payload.tv) {
    res.status(401).json({ error: 'Sessione scaduta' });
    return;
  }

  req.userId = user.id;
  next();
}
