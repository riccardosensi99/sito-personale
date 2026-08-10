import { useState } from 'react';
import { api } from '../../lib/api';

type Step = 'password' | 'totp';

export function Login({ onAuthenticated }: { onAuthenticated: () => void }) {
  const [step, setStep] = useState<Step>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [challenge, setChallenge] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submitPassword(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await api.post<{ challenge: string }>('/admin/auth/login', { email, password });
      setChallenge(res.challenge);
      setStep('totp');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login fallito');
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
        ) : (
          <form onSubmit={(e) => void submitTotp(e)}>
            <h1>Secondo fattore</h1>
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
