import { useEffect, useState } from 'react';
import { api } from '../../lib/api';

const LABELS: Record<string, string> = {
  hero: 'Hero',
  terminal: 'Terminale',
  services: 'Servizi',
  timeline: 'Esperienza',
  techRadar: 'Tech radar',
  beyond: 'Beyond code',
  contact: 'Contatti',
};

/// Editor JSON per i contenuti del sito. Grezzo di proposito: sono blocchi che si
/// toccano di rado e un form dedicato per ognuno costerebbe più di quanto renda.
export function SettingsEditor() {
  const [settings, setSettings] = useState<Record<string, unknown>>({});
  const [activeKey, setActiveKey] = useState<string | null>(null);
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
        const first = Object.keys(data)[0];
        if (first) {
          setActiveKey(first);
          setDraft(JSON.stringify(data[first], null, 2));
        }
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  function selectKey(key: string) {
    setActiveKey(key);
    setDraft(JSON.stringify(settings[key], null, 2));
    setNotice(null);
    setError(null);
  }

  async function save() {
    if (!activeKey) return;

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
      setNotice('Salvato. Ricarica la home per vedere il risultato.');
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
            cambiare i nomi dei campi.
          </p>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {notice && <div className="alert alert-ok">{notice}</div>}

      <div className="settings-keys">
        {Object.keys(settings).map((key) => (
          <button
            key={key}
            type="button"
            className={key === activeKey ? 'active' : ''}
            onClick={() => selectKey(key)}
          >
            {LABELS[key] ?? key}
          </button>
        ))}
      </div>

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
