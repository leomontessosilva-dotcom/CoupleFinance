import type { ReactNode } from 'react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Sidebar />
      <TopBar />
      <main
        style={{
          marginLeft: 'var(--sidebar-w)',
          paddingTop: 'var(--topbar-h)',
          minHeight: '100vh',
        }}
      >
        <div style={{ padding: '32px 36px', maxWidth: 1360, margin: '0 auto' }}>
          {children}
        </div>
      </main>
    </div>
  );
}
