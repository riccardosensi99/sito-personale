import type { SiteSettings } from './types';

/// Fallback usato finché l'API non risponde (e se non risponde affatto).
/// Rispecchia i valori che il seed scrive a database la prima volta.
export const DEFAULT_SETTINGS: SiteSettings = {
  hero: {
    available: true,
    availableLabel: 'Disponibile per nuovi progetti',
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
