import type { ReactNode } from 'react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f8f7ff]">
      <Sidebar />
      <TopBar />
      <main className="ml-64 pt-16 min-h-screen">
        <div className="p-8 max-w-[1400px]">
          {children}
        </div>
      </main>
    </div>
  );
}
