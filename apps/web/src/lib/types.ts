export type Project = {
  id: string;
  slug: string;
  title: string;
  description: string;
  body: string | null;
  categoryLabel: string;
  badge: string;
  accentColor: string;
  imageUrl: string | null;
  size: 'large' | 'small';
  tags: string[];
  order: number;
  visible: boolean;
  featured: boolean;
  githubRepoId: number | null;
  repoUrl: string | null;
  homepageUrl: string | null;
  stars: number;
  forks: number;
  language: string | null;
  topics: string[];
  pushedAt: string | null;
  lastSyncedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type RepoSummary = {
  githubRepoId: number;
  name: string;
  fullName: string;
  description: string | null;
  repoUrl: string;
  homepageUrl: string | null;
  stars: number;
  forks: number;
  language: string | null;
  topics: string[];
  pushedAt: string | null;
  fork: boolean;
  archived: boolean;
  imported: boolean;
};

// ─── Settings: il contenuto editoriale del sito ──────────────────────────────

/// Il puntatore al PDF caricato dal backoffice. Può mancare, o essere `{}`
/// quando il CV viene rimosso: chi lo legge deve controllare l'url, non la chiave.
export type CvSettings = { url?: string; nome?: string; caricatoIl?: string };

/// Solo i recapiti, e stanno in un blocco loro perché non sono testo di pagina:
/// cambiano per conto proprio e finiscono in tre posti diversi (contatti, footer,
/// pulsanti social).
export type ContactSettings = {
  email: string;
  github: string;
  linkedin: string;
};

/// Tutto il testo della pagina, sezione per sezione. Nei campi lunghi valgono i
/// marcatori di `lib/enfasi`: `_così_` per il corsivo, `*così*` per il grassetto.
///
/// Nei `kicker` il numero non va scritto: lo mette la home in base all'ordine
/// delle sezioni, e uno scritto a mano viene tolto prima di stampare. Serve a
/// non doverli rinumerare tutti, in ogni ambiente, ogni volta che una sezione
/// nasce o cambia posto.
export type HomeSettings = {
  nome: string;
  ruolo: string;
  /// La riga fissa sopra al titolo che si riscrive, in maiuscolo.
  titleGhost: string;
  /// Le parole che il titolo scrive e cancella a turno.
  roles: string[];
  bio: string;
  ctaLabel: string;
  stats: { value: string; label: string }[];
  /// Le voci del nastro diagonale, ripetute in ciclo.
  marquee: string[];
  about: {
    kicker: string;
    title: string;
    paragraphs: string[];
    /// La riga staccata dal filetto d'accento, in fondo alla sezione.
    note: string;
    skills: { title: string; text: string }[];
  };
  projects: { kicker: string; title: string; empty: string };
  /// Le voci si numerano da sole in base all'ordine: togliendone una in mezzo
  /// non resta un buco, e non c'è un numero da tenere allineato a mano.
  services: { kicker: string; title: string; items: { title: string; text: string }[] };
  contact: { kicker: string; title: string };
  piva: string;
};

export type SiteSettings = {
  home: HomeSettings;
  contact: ContactSettings;
  cv?: CvSettings;
};
