import { useEffect, type ReactNode } from 'react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import MobileNav from './MobileNav';
import { useStore } from '../store/useStore';

export default function Layout({ children }: { children: ReactNode }) {
  const { saveError, clearSaveError } = useStore();

  useEffect(() => {
    if (!saveError) return;
    const t = setTimeout(clearSaveError, 8000);
    return () => clearTimeout(t);
  }, [saveError]);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', overflowX: 'hidden' }}>
      <Sidebar />
      <TopBar />
      <main
        className="main-content"
        style={{
          marginLeft: 'var(--sidebar-w)',
          paddingTop: 'var(--topbar-h)',
          minHeight: '100vh',
        }}
      >
        <div className="page-inner" style={{ padding: '32px 36px', maxWidth: 1360, margin: '0 auto' }}>
          {children}
        </div>
      </main>
      <MobileNav />

      {/* Save error toast */}
      {saveError && (
        <div style={{
          position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
          background: '#1a1a2e', color: 'white',
          borderRadius: 12, padding: '12px 20px',
          display: 'flex', alignItems: 'center', gap: 12,
          boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
          zIndex: 9999, maxWidth: 520, width: 'calc(100% - 48px)',
          border: '1px solid rgba(220,38,38,0.4)',
        }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#DC2626', flexShrink: 0 }} />
          <p style={{ fontSize: 13, flex: 1, lineHeight: 1.4 }}>
            <strong style={{ color: '#FCA5A5' }}>Erro ao salvar — dado não persistido.</strong>{' '}
            <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>{saveError}</span>
          </p>
          <button onClick={clearSaveError} style={{
            background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)',
            cursor: 'pointer', fontSize: 16, lineHeight: 1, padding: 4, flexShrink: 0,
          }}>×</button>
        </div>
      )}
    </div>
  );
}
