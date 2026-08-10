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

export type GithubStats = {
  publicRepos: number;
  totalStars: number;
  followers: number;
  topLanguages: { name: string; count: number }[];
  fetchedAt: string;
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

export type HeroSettings = {
  available: boolean;
  availableLabel: string;
  /// Le due parole del claim gigante accanto al logo. Corte: sopra le ~7 lettere
  /// il tipo si rimpicciolisce e l'effetto poster si perde.
  claimLead: string;
  claimTrail: string;
  titleLead: string;
  titleAccent: string;
  copy: string;
  highlights: { title: string; text: string }[];
};

export type TerminalSettings = {
  host: string;
  /// Array e non oggetto: jsonb riordina le chiavi degli oggetti, e qui l'ordine
  /// delle righe di stack.json conta.
  stack: { key: string; values: string[] }[];
  status: string;
};

export type ServiceItem = { icon: string; title: string; text: string };
export type TimelineItem = { year: string; title: string; text: string };
export type RadarItem = { label: string; tag: string; level: number };
export type BeyondItem = { emoji: string; title: string; text: string };

export type ContactSettings = {
  kicker: string;
  titleLead: string;
  titleAccent: string;
  copy: string;
  email: string;
  github: string;
  linkedin: string;
};

export type SiteSettings = {
  hero: HeroSettings;
  terminal: TerminalSettings;
  services: ServiceItem[];
  timeline: TimelineItem[];
  techRadar: RadarItem[];
  beyond: BeyondItem[];
  contact: ContactSettings;
};
