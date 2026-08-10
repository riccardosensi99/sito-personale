import jwt from 'jsonwebtoken';
import type { CookieOptions, Response } from 'express';
import { env } from '../env.js';

export const SESSION_COOKIE = 'rs_session';

const SESSION_TTL = '8h';
const CHALLENGE_TTL = '5m';

export type SessionPayload = {
  sub: string;
  tv: number;
  typ: 'session';
};

export type ChallengePayload = {
  sub: string;
  typ: 'challenge';
};

export function signSession(userId: string, tokenVersion: number): string {
  const payload: SessionPayload = { sub: userId, tv: tokenVersion, typ: 'session' };
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: SESSION_TTL });
}

/// Token intermedio emesso dopo la password e speso dal secondo fattore.
export function signChallenge(userId: string): string {
  const payload: ChallengePayload = { sub: userId, typ: 'challenge' };
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: CHALLENGE_TTL });
}

export function verifySession(token: string): SessionPayload | null {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as SessionPayload;
    return decoded.typ === 'session' ? decoded : null;
  } catch {
    return null;
  }
}

export function verifyChallenge(token: string): ChallengePayload | null {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as ChallengePayload;
    return decoded.typ === 'challenge' ? decoded : null;
  } catch {
    return null;
  }
}

function cookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: env.isProd,
    sameSite: 'strict',
    path: '/',
    ...(env.COOKIE_DOMAIN ? { domain: env.COOKIE_DOMAIN } : {}),
  };
}

export function setSessionCookie(res: Response, token: string): void {
  res.cookie(SESSION_COOKIE, token, { ...cookieOptions(), maxAge: 8 * 60 * 60 * 1000 });
}

export function clearSessionCookie(res: Response): void {
  res.clearCookie(SESSION_COOKIE, cookieOptions());
}
