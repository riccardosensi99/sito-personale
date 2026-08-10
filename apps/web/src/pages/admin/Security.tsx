import { useEffect, useState } from 'react';
import { api } from '../../lib/api';

type Me = { email: string; lastLoginAt: string | null; totpEnabled: boolean };
type Enrollment = { secret: string; otpauth: string; qr: string };

/// Gestione del secondo fattore: qui si rigenera il secret quando si cambia
/// telefono, e da qui si chiudono tutte le sessioni aperte.
export function Security() {
  const [me, setMe] = useState<Me | null>(null);
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<Me>('/admin/auth/me')
      .then(setMe)
      .catch((err: Error) => setError(err.message));
  }, []);

  async function startReset(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      setEnrollment(await api.post<Enrollment>('/admin/auth/totp/reset', { password }));
      setPassword('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Operazione non riuscita');
    } finally {
      setBusy(false);
    }
  }

  async function activate(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api.post('/admin/auth/totp/activate', { code });
      setEnrollment(null);
      setCode('');
      setNotice('Secondo fattore aggiornato: da ora usa i codici del nuovo dispositivo.');
      setMe(await api.get<Me>('/admin/auth/me'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Codice non valido');
      setCode('');
    } finally {
      setBusy(false);
    }
  }

  async function revokeSessions() {
    if (!window.confirm('Chiudo tutte le sessioni, compresa questa. Confermi?')) return;
    await api.post('/admin/auth/revoke-sessions').catch(() => undefined);
    window.location.reload();
  }

  return (
    <>
      <div className="admin-head">
        <div>
          <h1>Sicurezza</h1>
          <p>Secondo fattore e sessioni attive di {me?.email ?? '…'}.</p>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {notice && <div className="alert alert-ok">{notice}</div>}

      <div className="panel" style={{ marginBottom: 20 }}>
        <h3>App authenticator</h3>

        {me && !me.totpEnabled && !enrollment && (
          <div className="alert alert-info">
            Il secondo fattore non è ancora attivo: verrà richiesto di configurarlo al prossimo
            accesso.
          </div>
        )}

        {!enrollment ? (
          <form onSubmit={(e) => void startReset(e)}>
            <p style={{ color: 'var(--muted)', lineHeight: 1.6, marginTop: 0 }}>
              Hai cambiato telefono o perso l'app? Genera un nuovo QR: quello vecchio smetterà di
              funzionare appena confermi il nuovo.
            </p>
            <div className="field" style={{ maxWidth: 340 }}>
              <label htmlFor="pw">Conferma la password</label>
              <input
                id="pw"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="btn-row" style={{ marginTop: 8 }}>
              <button type="submit" className="btn btn-secondary" disabled={busy || !password}>
                {busy ? 'Genero…' : 'Genera nuovo QR'}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={(e) => void activate(e)}>
            <p style={{ color: 'var(--muted)', lineHeight: 1.6, marginTop: 0 }}>
              Inquadra il QR con l'app, poi scrivi il codice per confermare. Finché non confermi, il
              secondo fattore resta disattivato.
            </p>

            <div className="totp-qr">
              <img src={enrollment.qr} alt="QR per l'app authenticator" width={220} height={220} />
            </div>
            <details className="totp-manual">
              <summary>Non riesci a inquadrarlo?</summary>
              <p>Inserisci questo codice a mano nell'app, e conservalo come scorta:</p>
              <code>{enrollment.secret}</code>
            </details>

            <div className="field" style={{ maxWidth: 340 }}>
              <label htmlFor="code">Codice di conferma</label>
              <input
                id="code"
                className="code-input"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="\d{6}"
                maxLength={6}
                required
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              />
            </div>

            <div className="btn-row" style={{ marginTop: 8 }}>
              <button type="submit" className="btn btn-primary" disabled={busy || code.length !== 6}>
                {busy ? 'Verifico…' : 'Conferma'}
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => setEnrollment(null)}>
                Annulla
              </button>
            </div>
          </form>
        )}
      </div>

      <div className="panel">
        <h3>Sessioni</h3>
        <p style={{ color: 'var(--muted)', lineHeight: 1.6, marginTop: 0 }}>
          Chiude tutti gli accessi aperti su qualunque dispositivo, incluso questo. Usalo se sospetti
          che qualcuno sia entrato.
        </p>
        <div className="btn-row" style={{ marginTop: 8 }}>
          <button type="button" className="btn btn-danger" onClick={() => void revokeSessions()}>
            Chiudi tutte le sessioni
          </button>
        </div>
      </div>
    </>
  );
}
