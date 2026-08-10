import { config } from 'dotenv';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { z } from 'zod';

// In sviluppo il file dell'ambiente sta alla radice del monorepo; nei container le
// variabili arrivano già dall'ambiente e questa lettura non trova (giustamente) nulla.
// dotenv non sovrascrive ciò che è già definito, quindi il primo file vince.
const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '../../..');
for (const file of ['.env.local', '.env']) {
  config({ path: path.join(repoRoot, file) });
}

const schema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  API_PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET deve essere lungo almeno 32 caratteri'),
  COOKIE_DOMAIN: z.string().optional(),
  CORS_ORIGINS: z.string().default('http://localhost:5173'),
  UPLOAD_DIR: z.string().default('/data/uploads'),
  GITHUB_USERNAME: z.string().default('riccardosensi99'),
  GITHUB_TOKEN: z.string().optional(),
  ADMIN_EMAIL: z.string().email().optional(),
  ADMIN_PASSWORD: z.string().optional(),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`).join('\n');
  console.error(`Configurazione non valida:\n${issues}`);
  process.exit(1);
}

export const env = {
  ...parsed.data,
  // Un UPLOAD_DIR relativo si intende dalla radice del repo, non dalla cwd di turno.
  UPLOAD_DIR: path.resolve(repoRoot, parsed.data.UPLOAD_DIR),
  isProd: parsed.data.NODE_ENV === 'production',
  corsOrigins: parsed.data.CORS_ORIGINS.split(',')
    .map((o) => o.trim())
    .filter(Boolean),
};
