import { lazy, Suspense } from 'react';
import { MotionConfig } from 'framer-motion';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Home from './pages/Home';

// Il backoffice sta in un chunk separato e vive su un path configurabile:
// chi apre il sito pubblico non ne scarica nemmeno un byte.
const AdminApp = lazy(() => import('./pages/admin/AdminApp'));

const ADMIN_PATH = (import.meta.env.VITE_ADMIN_PATH ?? 'admin').replace(/^\/+|\/+$/g, '');

export function App() {
  return (
    // reducedMotion="user": con prefers-reduced-motion attivo framer-motion smette
    // di animare trasformazioni e opacità, senza doverlo gestire componente per componente.
    <MotionConfig reducedMotion="user">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
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
