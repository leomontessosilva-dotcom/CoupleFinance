import { useStore } from '../store/useStore';
import {
  LayoutDashboard, Users, ArrowLeftRight, Receipt,
  TrendingUp, PiggyBank, LineChart,
} from 'lucide-react';

const navItems = [
  { id: 'dashboard', label: 'Visão Geral', icon: LayoutDashboard },
  { id: 'profiles', label: 'Perfis', icon: Users },
  { id: 'transactions', label: 'Transações', icon: ArrowLeftRight },
  { id: 'fixed', label: 'Gastos Fixos', icon: Receipt },
  { id: 'investments', label: 'Investimentos', icon: TrendingUp },
  { id: 'jars', label: 'Cofrinhos', icon: PiggyBank },
  { id: 'projections', label: 'Projeções', icon: LineChart },
];

export default function Sidebar() {
  const { activePage, setActivePage } = useStore();

  return (
    <aside
      style={{ width: 'var(--sidebar-w)' }}
      className="fixed left-0 top-0 h-full bg-white flex flex-col z-40"
      // 1px right border
    >
      <div style={{ borderRight: '1px solid var(--border)', height: '100%', display: 'flex', flexDirection: 'column' }}>

        {/* Wordmark */}
        <div className="px-5 pt-6 pb-5">
          <div className="flex items-center gap-2.5">
            {/* Monogram */}
            <div
              className="flex items-center justify-center text-white text-[11px] font-bold tracking-tight flex-shrink-0"
              style={{
                width: 30, height: 30,
                background: 'var(--accent)',
                borderRadius: 8,
                fontFamily: 'Fraunces, serif',
                fontStyle: 'italic',
                fontSize: 15,
                fontWeight: 300,
              }}
            >
              cf
            </div>
            <div>
              <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)', lineHeight: 1 }}>
                CoupleFinance
              </p>
              <p style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 2 }}>
                Leo & Serena · 2026
              </p>
            </div>
          </div>
        </div>

        {/* Divider */}
        <hr className="divider mx-5" />

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          <p className="eyebrow px-3 mb-3">Menu</p>
          {navItems.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActivePage(id)}
              className={`nav-item ${activePage === id ? 'active' : ''}`}
            >
              <Icon size={16} strokeWidth={activePage === id ? 2.2 : 1.8} />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        {/* Profile footer */}
        <div className="p-4">
          <hr className="divider mb-4" />
          <div className="flex items-center gap-3">
            {/* Avatars */}
            <div className="flex -space-x-2 flex-shrink-0">
              <div
                className="flex items-center justify-center text-white text-[11px] font-bold ring-2 ring-white"
                style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: 'var(--accent)',
                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                }}
              >
                L
              </div>
              <div
                className="flex items-center justify-center text-white text-[11px] font-bold ring-2 ring-white"
                style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: 'var(--pink)',
                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                }}
              >
                S
              </div>
            </div>
            <div className="min-w-0">
              <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-1)' }}>Leonardo & Serena</p>
              <p style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 1 }}>Família Silva</p>
            </div>
          </div>
        </div>

      </div>
    </aside>
  );
}
