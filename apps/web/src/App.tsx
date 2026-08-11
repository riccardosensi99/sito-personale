import { lazy, Suspense, type ReactNode } from 'react';
import { MotionConfig } from 'framer-motion';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Home from './pages/Home';

// Il backoffice sta in un chunk separato e vive su un path configurabile:
// chi apre il sito pubblico non ne scarica nemmeno un byte.
const AdminApp = lazy(() => import('./pages/admin/AdminApp'));

// La direzione chiara, in un chunk suo: se non è lei la home, chi apre il sito
// non ne scarica un byte finché non va a cercarla.
const Lab = lazy(() => import('./pages/Lab'));
const LabCookie = lazy(() => import('./pages/LabCookie'));

const ADMIN_PATH = (import.meta.env.VITE_ADMIN_PATH ?? 'admin').replace(/^\/+|\/+$/g, '');

/**
 * Quale delle due home serve questo build.
 *
 * La scelta è al build e non a runtime perché le VITE_* vengono sostituite da
 * Vite dentro il bundle: il confronto qui sotto diventa una costante, e il ramo
 * che non serve sparisce. Il prezzo è che cambiare direzione richiede un nuovo
 * deploy — che è esattamente il modo in cui la si vuole cambiare, non per
 * sbaglio da un pannello.
 *
 * Le due home restano comunque raggiungibili entrambe, su /classico e /lab, in
 * qualunque modo sia impostata questa variabile: senza, scegliendone una si
 * perderebbe il modo di guardare l'altra sullo stesso ambiente.
 */
const HOME_STYLE = import.meta.env.VITE_HOME_STYLE === 'light' ? 'light' : 'dark';

const attesa = (node: ReactNode) => <Suspense fallback={null}>{node}</Suspense>;

export function App() {
  return (
    // reducedMotion="user": con prefers-reduced-motion attivo framer-motion smette
    // di animare trasformazioni e opacità, senza doverlo gestire componente per componente.
    <MotionConfig reducedMotion="user">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={HOME_STYLE === 'light' ? attesa(<Lab />) : <Home />} />

          {/* Le due direzioni, sempre visitabili per confronto. */}
          <Route path="/classico" element={<Home />} />
          <Route path="/lab" element={attesa(<Lab />)} />
          <Route path="/lab/cookie" element={attesa(<LabCookie />)} />

          <Route
            path={`/${ADMIN_PATH}/*`}
            element={
              <Suspense fallback={<div className="admin-boot">Caricamento…</div>}>
                <AdminApp basePath={`/${ADMIN_PATH}`} />
              </Suspense>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </MotionConfig>
  );
}
