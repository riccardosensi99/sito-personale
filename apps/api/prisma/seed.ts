import argon2 from 'argon2';
import { authenticator } from 'otplib';
import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Come in src/env.ts: .env.local per lo sviluppo, .env come ripiego, e nei
// container vince comunque ciò che è già nell'ambiente.
const here = path.dirname(fileURLToPath(import.meta.url));
for (const file of ['.env.local', '.env']) {
  config({ path: path.resolve(here, '../../..', file) });
}

const prisma = new PrismaClient();

const DEFAULT_SETTINGS: Record<string, unknown> = {
  hero: {
    available: true,
    availableLabel: 'Disponibile per nuovi progetti',
    claimLead: 'build.',
    claimTrail: 'ship.',
    titleLead: 'Costruisco prodotti digitali',
    titleAccent: 'solidi, veloci e intelligenti.',
    copy: 'Sono Riccardo, Full Stack Developer e Flutter Developer. Progetto web app, backend, mobile app e automazioni AI con un approccio concreto: architetture pulite, interfacce chiare e prodotti pronti a crescere.',
    highlights: [
      { title: 'Full Stack', text: 'Web, API e database' },
      { title: 'Flutter', text: 'Mobile multipiattaforma' },
      { title: 'AI', text: 'Agenti e automazioni' },
    ],
  },
  terminal: {
    host: 'riccardo@cachyos: ~',
    stack: [
      { key: 'frontend', values: ['React', 'Vue', 'Flutter'] },
      { key: 'backend', values: ['Node', 'NestJS', 'Express'] },
      { key: 'data', values: ['PostgreSQL', 'Prisma'] },
      { key: 'infra', values: ['Docker', 'Nginx', 'Linux'] },
      { key: 'focus', values: ['AI Agents', 'Automation'] },
    ],
    status: 'Building useful products',
  },
  services: [
    { icon: '⌘', title: 'Web Platforms', text: 'Dashboard, gestionali e applicazioni web responsive con UI curate e flussi chiari.' },
    { icon: '⚙', title: 'Backend & API', text: 'API sicure, autenticazione, ruoli, log, database e architetture modulari.' },
    { icon: '◫', title: 'Mobile Apps', text: 'App Flutter per Android e iOS, integrate con servizi esterni e backend reali.' },
    { icon: '✦', title: 'AI Agents', text: 'Automazioni, assistenti intelligenti e workflow basati su modelli linguistici.' },
    { icon: '⬡', title: 'DevOps', text: 'Docker, Linux, Nginx, deploy, ambienti staging e configurazioni server.' },
    { icon: '↗', title: 'Open Source', text: 'Librerie, strumenti per developer, contributi e componenti riutilizzabili.' },
  ],
  timeline: [
    { year: 'NOW', title: 'Full Stack & Flutter Developer', text: 'Prodotti web, mobile, backend e strumenti AI in ambienti reali.' },
    { year: 'QAPEX', title: 'Software Development', text: 'Flutter, TypeScript, Python, Docker, PostgreSQL e sviluppo su VM.' },
    { year: 'R&D', title: 'Ridan Labs', text: 'Progetti indipendenti, consulenza tecnica e sperimentazione AI.' },
    { year: 'OSS', title: 'Open Source', text: 'Librerie, pull request e strumenti pensati per altri developer.' },
  ],
  techRadar: [
    { label: 'TypeScript / JavaScript', tag: 'Core', level: 94 },
    { label: 'Node / Express / NestJS', tag: 'Backend', level: 90 },
    { label: 'React / Vue', tag: 'Frontend', level: 87 },
    { label: 'Flutter', tag: 'Mobile', level: 88 },
    { label: 'PostgreSQL / Prisma', tag: 'Data', level: 91 },
    { label: 'Docker / Linux / Nginx', tag: 'Infra', level: 84 },
    { label: 'AI / Automation', tag: 'Focus', level: 82 },
  ],
  beyond: [
    { emoji: '🏍️', title: 'Motorsport', text: 'Passione per moto, pista e miglioramento continuo.' },
    { emoji: '🐧', title: 'Linux', text: 'CachyOS, Arch, terminale e ambienti ottimizzati per sviluppare.' },
    { emoji: '🤖', title: 'AI', text: 'Sperimentazione continua su agenti, automazioni e nuovi workflow.' },
    { emoji: '🎧', title: 'Music', text: 'Una buona playlist accompagna quasi ogni sessione di coding.' },
  ],
  contact: {
    kicker: "Let's build",
    titleLead: 'Hai un progetto ambizioso?',
    titleAccent: 'Costruiamolo bene.',
    copy: 'Disponibile per collaborazioni, prodotti digitali, consulenza tecnica e sviluppo end-to-end.',
    email: 'riccardosensi57@gmail.com',
    github: 'https://github.com/riccardosensi99',
    linkedin: 'https://linkedin.com/in/riccardo-sensi-developer',
  },
};

async function seedAdmin(): Promise<void> {
  const email = process.env.ADMIN_EMAIL?.toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.log('ADMIN_EMAIL/ADMIN_PASSWORD non impostati: salto la creazione dell\'admin.');
    return;
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`Admin ${email} già presente, lascio invariati password e secret TOTP.`);
    return;
  }

  const passwordHash = await argon2.hash(password, { type: argon2.argon2id });
  const totpSecret = authenticator.generateSecret();

  // totpEnabled resta false: il QR lo mostrerà il backoffice al primo accesso,
  // così il secret non passa dai log del terminale né dall'output di un deploy.
  await prisma.user.create({ data: { email, passwordHash, totpSecret } });

  console.log('\n────────────────────────────────────────────────────────');
  console.log(` Admin creato: ${email}`);
  console.log(' Al primo accesso il backoffice ti mostrerà il QR da scansionare');
  console.log(' con l\'app authenticator.');
  console.log('────────────────────────────────────────────────────────\n');
}

async function seedSettings(): Promise<void> {
  for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
    // create-only: non sovrascrivo quello che hai già modificato dal backoffice.
    await prisma.setting.upsert({
      where: { key },
      update: {},
      create: { key, value: value as object },
    });
  }
  console.log(`Settings di default garantiti (${Object.keys(DEFAULT_SETTINGS).length} chiavi).`);
}

async function main(): Promise<void> {
  await seedAdmin();
  await seedSettings();
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
