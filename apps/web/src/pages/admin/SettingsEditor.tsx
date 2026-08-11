import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { DEFAULT_SETTINGS } from '../../lib/defaults';

const LABELS: Record<string, string> = {
  home: 'Testi della pagina',
  contact: 'Recapiti',
  cv: 'Curriculum',
};

/// I blocchi che il sito si aspetta di trovare, nell'ordine in cui compaiono
/// nelle pagine. L'elenco sta qui e non nelle chiavi che il database restituisce
/// perché un blocco nuovo — aggiunto dopo che un ambiente era già in piedi — a
/// database non c'è ancora: senza questa lista non comparirebbe, e non ci sarebbe
/// modo di crearlo se non ri-eseguendo il seed.
const BLOCCHI = Object.keys(DEFAULT_SETTINGS);

const DEFAULTS = DEFAULT_SETTINGS as unknown as Record<string, unknown>;

/// Il valore salvato se c'è, altrimenti quello di default: così un blocco mai
/// salvato si apre già pieno e "Salva blocco" lo crea con i contenuti giusti,
/// invece di partire da una casella vuota da riempire a mano.
function valoreDi(key: string, settings: Record<string, unknown>): unknown {
  return key in settings ? settings[key] : (DEFAULTS[key] ?? {});
}

/// Editor JSON per i contenuti del sito. Grezzo di proposito: sono blocchi che si
/// toccano di rado e un form dedicato per ognuno costerebbe più di quanto renda.
export function SettingsEditor() {
  const [settings, setSettings] = useState<Record<string, unknown>>({});
  const [activeKey, setActiveKey] = useState<string>(BLOCCHI[0] ?? '');
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<Record<string, unknown>>('/admin/settings')
      .then((data) => {
        setSettings(data);
        const first = BLOCCHI[0] ?? Object.keys(data)[0];
        if (first) {
          setActiveKey(first);
          setDraft(JSON.stringify(valoreDi(first, data), null, 2));
        }
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  // I blocchi previsti per primi, poi le eventuali chiavi in più scritte a mano.
  const keys = [...BLOCCHI, ...Object.keys(settings).filter((k) => !BLOCCHI.includes(k))];
  const daCreare = activeKey !== '' && !(activeKey in settings);

  function selectKey(key: string) {
    setActiveKey(key);
    setDraft(JSON.stringify(valoreDi(key, settings), null, 2));
    setNotice(null);
    setError(null);
  }

  async function save() {
    if (!activeKey) return;
    const creazione = !(activeKey in settings);

    let parsed: unknown;
    try {
      parsed = JSON.parse(draft);
    } catch {
      setError('JSON non valido: controlla virgole e parentesi.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await api.put(`/admin/settings/${activeKey}`, { value: parsed });
      setSettings((s) => ({ ...s, [activeKey]: parsed }));
      setNotice(
        creazione
          ? 'Blocco creato. Ricarica la home per vedere il risultato.'
          : 'Salvato. Ricarica la home per vedere il risultato.',
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Salvataggio non riuscito');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p style={{ color: 'var(--muted)' }}>Carico…</p>;

  return (
    <>
      <div className="admin-head">
        <div>
          <h1>Contenuti sito</h1>
          <p>
            Testi, esperienze, servizi e link social. Ogni blocco è un JSON: modifica i valori senza
            cambiare i nomi dei campi. Nei testi lunghi <code>_così_</code> diventa corsivo e{' '}
            <code>*così*</code> grassetto.
          </p>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {notice && <div className="alert alert-ok">{notice}</div>}

      <div className="settings-keys">
        {keys.map((key) => (
          <button
            key={key}
            type="button"
            className={`${key === activeKey ? 'active' : ''}${key in settings ? '' : ' is-new'}`}
            title={key in settings ? undefined : 'Blocco non ancora salvato'}
            onClick={() => selectKey(key)}
          >
            {LABELS[key] ?? key}
          </button>
        ))}
      </div>

      {daCreare && (
        <div className="alert alert-info">
          Questo blocco non è mai stato salvato: quello che vedi sono i valori di partenza. Salvalo
          per scriverlo a database e renderlo modificabile.
        </div>
      )}

      <div className="settings-editor">
        <div className="field">
          <label htmlFor="json">{activeKey}</label>
          <textarea
            id="json"
            spellCheck={false}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />
        </div>
        <div className="btn-row" style={{ marginTop: 6 }}>
          <button type="button" className="btn btn-primary" disabled={saving} onClick={() => void save()}>
            {saving ? 'Salvo…' : 'Salva blocco'}
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => activeKey && selectKey(activeKey)}
          >
            Annulla modifiche
          </button>
        </div>
      </div>
    </>
  );
}
