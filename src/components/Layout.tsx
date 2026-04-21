import type { ReactNode } from 'react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import MobileNav from './MobileNav';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
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
    </div>
  );
}
