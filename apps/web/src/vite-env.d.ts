/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  /// Path del backoffice, senza slash. Cambiarlo sposta l'intera area admin.
  readonly VITE_ADMIN_PATH?: string;
  readonly VITE_SITE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface Window {
  /// La definisce lo script della copertina in index.html, e solo dove la
  /// copertina esiste davvero: sulle altre rotte è undefined, ed è così che
  /// hooks/useOpening.ts sa di non avere niente da chiudere.
  __chiudiCopertina?: () => void;
}
