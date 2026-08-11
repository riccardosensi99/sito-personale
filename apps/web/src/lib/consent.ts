/**
 * Stato del consenso ai cookie.
 *
 * Oggi il sito imposta un solo cookie, quello di sessione del backoffice: è
 * tecnico, vive solo dopo il secondo fattore e non richiede consenso. Per
 * questo l'avviso è informativo e non blocca nulla.
 *
 * L'impianto però è già a categorie: quando arriverà qualcosa di non
 * necessario — un contatore di visite, una mappa, un video incorporato — basta
 * aggiungerla a OPZIONALI e l'avviso diventa una scelta vera, con il rifiuto
 * alla stessa distanza dell'accettazione. Finché quella lista è vuota,
 * chiedere un consenso sarebbe teatro: si starebbe domandando il permesso per
 * qualcosa che non si fa.
 */

const CHIAVE = 'rs-cookie';

/** Categorie non necessarie effettivamente in uso. Vuota per scelta, non per dimenticanza. */
export const OPZIONALI: string[] = [];

export type Consenso = {
  /** Versione dell'informativa accettata: cambiandola l'avviso ritorna. */
  v: number;
  /** Categorie opzionali concesse. */
  ok: string[];
};

export const VERSIONE = 1;

/**
 * Ricordare la scelta è a sua volta un'operazione di memorizzazione, ma è
 * quella che serve a rispettare la scelta stessa: rientra fra le necessarie e
 * resta in localStorage, che non viaggia a ogni richiesta come farebbe un
 * cookie.
 */
export function leggiConsenso(): Consenso | null {
  try {
    const raw = localStorage.getItem(CHIAVE);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Consenso;
    if (typeof parsed?.v !== 'number' || !Array.isArray(parsed.ok)) return null;
    // Informativa cambiata: la scelta vecchia non vale più.
    if (parsed.v !== VERSIONE) return null;
    return parsed;
  } catch {
    // localStorage negato (navigazione privata, storage pieno): si riparte da
    // capo a ogni visita, che è il comportamento prudente.
    return null;
  }
}

export function salvaConsenso(ok: string[]): void {
  try {
    localStorage.setItem(CHIAVE, JSON.stringify({ v: VERSIONE, ok } satisfies Consenso));
  } catch {
    // Se non si può scrivere, l'avviso ricomparirà: meglio insistere che
    // dare per acquisito un consenso che non si è potuto registrare.
  }
}

/** Vero se quella categoria opzionale è stata concessa. */
export function consentito(categoria: string): boolean {
  return leggiConsenso()?.ok.includes(categoria) ?? false;
}
