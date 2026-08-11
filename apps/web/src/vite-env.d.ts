/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  /// Path del backoffice, senza slash. Cambiarlo sposta l'intera area admin.
  readonly VITE_ADMIN_PATH?: string;
  readonly VITE_SITE_URL?: string;
  /// Quale home serve questo build: 'dark' (il sito storico) o 'light' (la
  /// direzione chiara). Si decide al build, perché le VITE_* finiscono nel
  /// bundle; entrambe restano comunque raggiungibili su /classico e /lab.
  readonly VITE_HOME_STYLE?: 'dark' | 'light';
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
