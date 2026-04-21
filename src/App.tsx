import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './lib/supabase';
import { useStore } from './store/useStore';

import Layout from './components/Layout';
import Login from './pages/Login';
import SetupRequired from './pages/SetupRequired';

import Dashboard from './pages/Dashboard';
import Profiles from './pages/Profiles';
import Transactions from './pages/Transactions';
import FixedExpenses from './pages/FixedExpenses';
import Investments from './pages/Investments';
import Cofrinhos from './pages/Cofrinhos';
import Projections from './pages/Projections';

// ── Full-page loader ──────────────────────────────────────────
function Loader() {
  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 16,
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: 12,
        background: 'var(--accent)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ fontFamily: 'Fraunces, serif', fontSize: 20, fontWeight: 300, fontStyle: 'italic', color: 'white' }}>
          cf
        </span>
      </div>
      {/* Spinner ring */}
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
        style={{ animation: 'spin 0.8s linear infinite' }}>
        <circle cx="12" cy="12" r="10" stroke="var(--border)" strokeWidth="2.5" />
        <path d="M12 2 a10 10 0 0 1 10 10" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
      <p style={{ fontSize: 12, color: 'var(--text-3)' }}>Carregando dados...</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ── Page router ───────────────────────────────────────────────
function Pages() {
  const { activePage } = useStore();
  switch (activePage) {
    case 'dashboard':    return <Dashboard />;
    case 'profiles':     return <Profiles />;
    case 'transactions': return <Transactions />;
    case 'fixed':        return <FixedExpenses />;
    case 'investments':  return <Investments />;
    case 'jars':         return <Cofrinhos />;
    case 'projections':  return <Projections />;
    default:             return <Dashboard />;
  }
}

// ── Root App ──────────────────────────────────────────────────
export default function App() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const { initData, isLoading, dbError } = useStore();

  // 1. Resolve auth session
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_ev, s) => {
      setSession(s);
    });
    return () => subscription.unsubscribe();
  }, []);

  // 2. When session is confirmed, load data from Supabase
  useEffect(() => {
    if (session) initData();
  }, [session]);

  // 3. Auth resolving (not yet known)
  if (session === undefined) return <Loader />;

  // 4. Not logged in
  if (!session) return <Login />;

  // 5. Logged in but data still loading
  if (isLoading) return <Loader />;

  // 6. DB tables missing → show setup guide
  if (dbError === 'tables_missing') return <SetupRequired />;

  // 7. All good — show the app
  return (
    <Layout>
      <Pages />
    </Layout>
  );
}
