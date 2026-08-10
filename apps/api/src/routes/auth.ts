import { Router } from 'express';
import { randomBytes } from 'node:crypto';
import argon2 from 'argon2';
import { authenticator } from 'otplib';
import { z } from 'zod';
import { prisma } from '../prisma.js';
import { authLimiter } from '../middleware/rateLimit.js';
import { requireAuth } from '../middleware/requireAuth.js';
import {
  clearSessionCookie,
  setSessionCookie,
  signChallenge,
  signSession,
  verifyChallenge,
} from '../services/token.js';

export const authRouter = Router();

// Tollera uno scarto di ±30s tra l'orologio del server e quello del telefono.
authenticator.options = { window: 1 };

// Hash "civetta" calcolato una sola volta: serve a far costare uguale un login con
// email inesistente e uno con email giusta e password sbagliata.
let decoyHash: Promise<string> | null = null;
function getDecoyHash(): Promise<string> {
  decoyHash ??= argon2.hash(randomBytes(32).toString('hex'), { type: argon2.argon2id });
  return decoyHash;
}

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const totpSchema = z.object({
  challenge: z.string().min(1),
  code: z.string().regex(/^\d{6}$/, 'Il codice deve avere 6 cifre'),
});

/// Primo fattore. Non emette ancora la sessione: restituisce solo un challenge
/// a breve scadenza che va speso su /verify-totp.
authRouter.post('/login', authLimiter, async (req, res) => {
  const { email, password } = loginSchema.parse(req.body);

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });

  // Verifica anche quando l'utente non esiste, così il tempo di risposta non rivela l'email.
  const hash = user?.passwordHash ?? (await getDecoyHash());
  const valid = await argon2.verify(hash, password).catch(() => false);

  if (!user || !valid) {
    res.status(401).json({ error: 'Credenziali non valide' });
    return;
  }

  res.json({ challenge: signChallenge(user.id), step: 'totp' });
});

/// Secondo fattore: solo qui viene emesso il cookie di sessione.
authRouter.post('/verify-totp', authLimiter, async (req, res) => {
  const { challenge, code } = totpSchema.parse(req.body);

  const payload = verifyChallenge(challenge);
  if (!payload) {
    res.status(401).json({ error: 'Sessione di login scaduta, rifai il login' });
    return;
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user) {
    res.status(401).json({ error: 'Utente non trovato' });
    return;
  }

  const ok = authenticator.verify({ token: code, secret: user.totpSecret });
  if (!ok) {
    res.status(401).json({ error: 'Codice non valido' });
    return;
  }

  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  setSessionCookie(res, signSession(user.id, user.tokenVersion));
  res.json({ ok: true, email: user.email });
});

authRouter.get('/me', requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId! },
    select: { email: true, lastLoginAt: true },
  });
  res.json(user);
});

authRouter.post('/logout', requireAuth, (_req, res) => {
  clearSessionCookie(res);
  res.json({ ok: true });
});

/// Invalida tutte le sessioni attive (utile se perdi un dispositivo).
authRouter.post('/revoke-sessions', requireAuth, async (req, res) => {
  await prisma.user.update({
    where: { id: req.userId! },
    data: { tokenVersion: { increment: 1 } },
  });
  clearSessionCookie(res);
  res.json({ ok: true });
});
