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
  // Il testo della pagina, sezione per sezione. Nei campi lunghi `_così_` è un
  // corsivo e `*così*` un grassetto: li interpreta lib/enfasi sul web, così
  // l'enfasi passa dal backoffice senza far viaggiare HTML in un campo di testo.
  home: {
    nome: 'Riccardo Sensi',
    ruolo: 'Full stack developer',
    titleGhost: 'SONO NATO PER',
    roles: ['FULL STACK DEVELOPER', 'CREATIVE CODER', 'PROBLEM SOLVER', 'AUTOMATION BUILDER'],
    bio: 'Costruisco gestionali, automazioni e interfacce che stanno in piedi anche quando i dati veri arrivano tutti insieme.',
    ctaLabel: 'PARLIAMONE',
    stats: [
      { value: '3+', label: 'anni di esperienza' },
      { value: '30+', label: 'progetti realizzati' },
    ],
    marquee: [
      'FULL STACK DEVELOPER',
      'REACT & NODE',
      'AUTOMAZIONI SU MISURA',
      'GESTIONALI',
      'AI AGENTS',
    ],
    about: {
      kicker: '01 — Chi sono',
      title: 'Scrivo software che _regge_ quando smette di essere una demo.',
      paragraphs: [
        "Lavoro sul pezzo intero: il database, l'API, l'interfaccia e la macchina su cui gira. Mi interessa la parte che di solito si scopre dopo — i permessi, i casi limite, cosa succede quando due persone salvano lo stesso record nello stesso momento.",
        'Preferisco poche schermate che fanno esattamente ciò che serve a una dashboard piena di grafici che nessuno guarda.',
      ],
      note: 'Collaboro con *aziende* su progetti continuativi e ho lavorato con *startup* nella fase in cui bisogna costruire in fretta senza fare debito che poi si paga con gli interessi.',
      skills: [
        { title: 'Backend', text: 'Node, Express, Prisma, PostgreSQL, autenticazione e ruoli' },
        { title: 'Frontend', text: 'React, TypeScript, Vite, animazioni e design system' },
        { title: 'Infrastruttura', text: 'Docker, nginx, deploy su VPS, ambienti separati' },
        { title: 'Automazioni', text: 'agenti, integrazioni fra servizi, script che tolgono lavoro' },
      ],
    },
    projects: {
      kicker: '02 — Progetti',
      title: 'Cose che girano, non slide.',
      empty: 'Nessun progetto pubblicato al momento. Torna a trovarmi tra poco.',
    },
    contact: {
      kicker: '03 — Contatti',
      title: "Hai un'idea che _deve funzionare_?",
    },
    piva: '04030250544',
  },
  contact: {
    email: 'riccardosensi57@gmail.com',
    github: 'https://github.com/riccardosensi99',
    linkedin: 'https://linkedin.com/in/riccardo-sensi-developer',
  },
};

/// Le chiavi del sito scuro, che non esiste più. Restavano a database sugli
/// ambienti già in piedi — il seed non cancella mai da solo ciò che ha creato —
/// e il backoffice continuerebbe a elencarle fra i blocchi buoni.
const CHIAVI_OBSOLETE = ['hero', 'terminal', 'services', 'timeline', 'techRadar', 'beyond', 'lab'];

/// Dentro `contact` il sito scuro teneva anche il testo della sua sezione
/// contatti. Il blocco resta, perché email e link sono quelli veri e magari
/// modificati a mano: si tolgono i quattro campi di troppo, uno per uno, senza
/// riscrivere ciò che c'è intorno.
const CAMPI_CONTACT_OBSOLETI = ['kicker', 'titleLead', 'titleAccent', 'copy'];


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

async function rimuoviSettingsObsolete(): Promise<void> {
  const { count } = await prisma.setting.deleteMany({ where: { key: { in: CHIAVI_OBSOLETE } } });
  if (count > 0) console.log(`Rimosse ${count} chiavi del vecchio sito scuro.`);

  const contact = await prisma.setting.findUnique({ where: { key: 'contact' } });
  const valore = contact?.value;
  if (!valore || typeof valore !== 'object' || Array.isArray(valore)) return;

  const restanti = Object.fromEntries(
    Object.entries(valore).filter(([campo]) => !CAMPI_CONTACT_OBSOLETI.includes(campo)),
  );
  if (Object.keys(restanti).length === Object.keys(valore).length) return;

  await prisma.setting.update({ where: { key: 'contact' }, data: { value: restanti } });
  console.log('Ripuliti i campi di troppo dentro `contact`.');
}

async function main(): Promise<void> {
  await seedAdmin();
  await seedSettings();
  await rimuoviSettingsObsolete();
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
