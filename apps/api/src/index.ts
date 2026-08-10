import { createApp } from './app.js';
import { env } from './env.js';
import { prisma } from './prisma.js';

const app = createApp();

const server = app.listen(env.API_PORT, () => {
  console.log(`API in ascolto su http://localhost:${env.API_PORT} (${env.NODE_ENV})`);
});

async function shutdown(signal: string): Promise<void> {
  console.log(`\n${signal} ricevuto, chiudo...`);
  server.close();
  await prisma.$disconnect();
  process.exit(0);
}

process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));
