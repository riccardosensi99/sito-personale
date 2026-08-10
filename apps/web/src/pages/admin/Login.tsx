import { useState } from 'react';
import { api } from '../../lib/api';

type Step = 'password' | 'totp' | 'setup';

type Enrollment = { secret: string; otpauth: string; qr: string };

export function Login({ onAuthenticated }: { onAuthenticated: () => void }) {
  const [step, setStep] = useState<Step>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [challenge, setChallenge] = useState('');
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submitPassword(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await api.post<{ challenge: string; step: 'totp' | 'totp-setup' }>(
        '/admin/auth/login',
        { email, password },
      );
      setChallenge(res.challenge);

      // Primo accesso: prima di poter chiedere un codice bisogna far configurare l'app.
      if (res.step === 'totp-setup') {
        setEnrollment(
          await api.post<Enrollment>('/admin/auth/totp/setup', { challenge: res.challenge }),
        );
        setStep('setup');
      } else {
        setStep('totp');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login fallito');
    } finally {
      setBusy(false);
    }
  }

  async function confirmSetup(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api.post('/admin/auth/totp/confirm', { challenge, code });
      onAuthenticated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Codice non valido');
      setCode('');
    } finally {
      setBusy(false);
    }
  }

  async function submitTotp(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api.post('/admin/auth/verify-totp', { challenge, code });
      onAuthenticated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Codice non valido');
      setCode('');
    } finally {
      setBusy(false);
    }
  }

  function restart() {
    setStep('password');
    setCode('');
    setChallenge('');
    setEnrollment(null);
    setError(null);
  }

  return (
    <div className="login-screen">
      <div className="login-card">
        <span className="brand-mark">RS</span>

        {step === 'password' ? (
          <form onSubmit={(e) => void submitPassword(e)}>
            <h1>Backoffice</h1>
            <p>Area riservata. Serve la password e il codice dell'app authenticator.</p>

            {error && <div className="alert alert-error">{error}</div>}

            <div className="field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="btn-row">
              <button type="submit" className="btn btn-primary" disabled={busy}>
                {busy ? 'Verifico…' : 'Continua'}
              </button>
            </div>
          </form>
        ) : step === 'setup' ? (
          <form onSubmit={(e) => void confirmSetup(e)}>
            <h1>Attiva il secondo fattore</h1>
            <p>
              Inquadra il QR con Google Authenticator, Aegis o 1Password, poi scrivi il codice che
              compare per confermare.
            </p>

            {error && <div className="alert alert-error">{error}</div>}

            {enrollment && (
              <>
                <div className="totp-qr">
                  <img src={enrollment.qr} alt="QR per l'app authenticator" width={220} height={220} />
                </div>
                <details className="totp-manual">
                  <summary>Non riesci a inquadrarlo?</summary>
                  <p>Inserisci questo codice a mano nell'app, e conservalo come scorta:</p>
                  <code>{enrollment.secret}</code>
                </details>
              </>
            )}

            <div className="field">
              <label htmlFor="setup-code">Codice di conferma</label>
              <input
                id="setup-code"
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

            <div className="btn-row">
              <button type="submit" className="btn btn-primary" disabled={busy || code.length !== 6}>
                {busy ? 'Verifico…' : 'Attiva ed entra'}
              </button>
              <button type="button" className="btn btn-ghost" onClick={restart}>
                Indietro
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={(e) => void submitTotp(e)}>
            <h1>Authenticator</h1>
            <p>Inserisci il codice a 6 cifre generato dall'app authenticator.</p>

            {error && <div className="alert alert-error">{error}</div>}

            <div className="field">
              <label htmlFor="code">Codice</label>
              <input
                id="code"
                className="code-input"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="\d{6}"
                maxLength={6}
                required
                autoFocus
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              />
            </div>

            <div className="btn-row">
              <button type="submit" className="btn btn-primary" disabled={busy || code.length !== 6}>
                {busy ? 'Verifico…' : 'Entra'}
              </button>
              <button type="button" className="btn btn-ghost" onClick={restart}>
                Indietro
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
