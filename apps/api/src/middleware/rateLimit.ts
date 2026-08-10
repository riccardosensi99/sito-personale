import rateLimit from 'express-rate-limit';

/// Login e secondo fattore: pochi tentativi, finestra lunga.
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: { error: 'Troppi tentativi, riprova tra qualche minuto' },
});

/// Resto delle rotte admin: generoso, serve solo a contenere gli abusi.
export const adminLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 120,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Troppe richieste' },
});

export const publicLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 300,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Troppe richieste' },
});
