import type { SiteSettings } from './types';

/// Fallback usato finché l'API non risponde (e se non risponde affatto).
/// Rispecchia i valori che il seed scrive a database la prima volta.
export const DEFAULT_SETTINGS: SiteSettings = {
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
      kicker: 'Chi sono',
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
      kicker: 'Progetti',
      title: 'Cose che girano, non slide.',
      empty: 'Nessun progetto pubblicato al momento. Torna a trovarmi tra poco.',
    },
    /// I testi di partenza non inventano niente: sono le stesse cose che il
    /// sito già dichiara nel nastro, nelle competenze e nella bio, rimesse
    /// nell'ordine in cui le cerca chi deve decidere se scrivere.
    services: {
      kicker: 'Servizi',
      title: 'Quello per cui mi _chiamano_.',
      items: [
        {
          title: 'Gestionali su misura',
          text: 'Anagrafiche, ruoli, permessi e report: il software interno che prende il posto del foglio di calcolo condiviso, e che regge quando lo usano in dieci nello stesso momento.',
        },
        {
          title: 'Web app e interfacce',
          text: 'React e TypeScript davanti, Node e PostgreSQL dietro. Poche schermate che fanno esattamente ciò che serve, invece di una dashboard piena di grafici che nessuno guarda.',
        },
        {
          title: 'Automazioni e agenti AI',
          text: 'Integrazioni fra i servizi che già usi e procedure che tolgono lavoro ripetitivo, con i controlli al posto giusto perché un errore non si propaghi in silenzio.',
        },
        {
          title: 'Messa in produzione',
          text: 'Docker, nginx e deploy su server, con ambienti separati per provare prima di pubblicare. Un progetto non è finito quando compila: è finito quando gira.',
        },
      ],
    },
    contact: {
      kicker: 'Contatti',
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
