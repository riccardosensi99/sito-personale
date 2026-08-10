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
