import { useEffect, useRef, useState } from 'react';
import { Download, FileText, Trash2, Upload } from 'lucide-react';
import { api } from '../../lib/api';

/**
 * Gestione del CV pubblico.
 *
 * Il file passa dallo stesso canale delle immagini dei progetti e finisce nel
 * volume degli upload; nelle impostazioni resta solo il puntatore, sotto la
 * chiave `cv`. Il footer del sito legge quella chiave: sostituire il PDF non
 * richiede un deploy, come per il resto dei contenuti.
 */

type Cv = { url: string; nome: string; caricatoIl: string } | null;

const MAX_MB = 4;

export function CvManager() {
  const [cv, setCv] = useState<Cv>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api
      .get<Record<string, unknown>>('/admin/settings')
      .then((settings) => {
        const value = settings.cv;
        // La chiave può non esistere ancora, o essere stata scritta a mano
        // dall'editor JSON: si accetta solo ciò che ha davvero un url.
        if (value && typeof value === 'object' && 'url' in value) setCv(value as Cv);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  async function save(next: Cv) {
    await api.put('/admin/settings/cv', { value: next ?? {} });
    setCv(next);
  }

  async function onPick(file: File) {
    setError(null);
    setNotice(null);

    if (file.type !== 'application/pdf') {
      setError('Il CV deve essere un PDF.');
      return;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      setError(`Il file pesa ${(file.size / 1024 / 1024).toFixed(1)} MB: il limite è ${MAX_MB} MB.`);
      return;
    }

    setBusy(true);
    try {
      const { url } = await api.upload<{ url: string }>('/admin/uploads', file);
      await save({ url, nome: file.name, caricatoIl: new Date().toISOString() });
      setNotice('CV caricato. È già online.');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
      // Senza questo, ricaricare lo stesso file non scatenerebbe onChange.
      if (fileInput.current) fileInput.current.value = '';
    }
  }

  async function remove() {
    setBusy(true);
    setError(null);
    try {
      await save(null);
      setNotice('CV rimosso: il pulsante sparisce dal sito.');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="admin-head">
        <div>
          <h1>Curriculum</h1>
          <p>
            Il PDF che il sito mette in scarica nel footer. Caricandone uno nuovo il vecchio resta
            sul disco ma non è più collegato da nessuna parte.
          </p>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {notice && <div className="alert alert-ok">{notice}</div>}

      {loading ? (
        <p className="admin-empty">Carico…</p>
      ) : (
        <div className="cv-panel">
          {cv ? (
            <div className="cv-current">
              <span className="cv-icon" aria-hidden="true">
                <FileText />
              </span>
              <div className="cv-meta">
                <strong>{cv.nome}</strong>
                <span>
                  caricato il {new Date(cv.caricatoIl).toLocaleDateString('it-IT')} · {cv.url}
                </span>
              </div>
              <div className="row-actions">
                <a className="btn btn-secondary btn-sm" href={cv.url} target="_blank" rel="noreferrer">
                  <Download aria-hidden="true" /> Apri
                </a>
                <button
                  type="button"
                  className="btn btn-danger btn-sm"
                  disabled={busy}
                  onClick={() => void remove()}
                >
                  <Trash2 aria-hidden="true" /> Rimuovi
                </button>
              </div>
            </div>
          ) : (
            <p className="admin-empty">
              Nessun CV caricato: nel footer del sito il pulsante non compare.
            </p>
          )}

          <label className="cv-drop">
            <input
              ref={fileInput}
              type="file"
              accept="application/pdf"
              disabled={busy}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void onPick(file);
              }}
            />
            <span className="cv-drop-icon" aria-hidden="true">
              <Upload />
            </span>
            <strong>{busy ? 'Carico…' : cv ? 'Sostituisci il CV' : 'Carica il CV'}</strong>
            <span>PDF, massimo {MAX_MB} MB</span>
          </label>
        </div>
      )}
    </>
  );
}
