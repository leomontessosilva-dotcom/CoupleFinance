import { useStore } from '../store/useStore';
import {
  LayoutDashboard, Users, ArrowLeftRight, Receipt,
  TrendingUp, PiggyBank, LineChart,
} from 'lucide-react';

const navItems = [
  { id: 'dashboard',    label: 'Visão Geral',  icon: LayoutDashboard },
  { id: 'profiles',     label: 'Perfis',        icon: Users },
  { id: 'transactions', label: 'Transações',    icon: ArrowLeftRight },
  { id: 'fixed',        label: 'Gastos Fixos',  icon: Receipt },
  { id: 'investments',  label: 'Investimentos', icon: TrendingUp },
  { id: 'jars',         label: 'Cofrinhos',     icon: PiggyBank },
  { id: 'projections',  label: 'Projeções',     icon: LineChart },
];

export default function Sidebar() {
  const { activePage, setActivePage } = useStore();

  return (
    <aside
      style={{ width: 'var(--sidebar-w)' }}
      className="fixed left-0 top-0 h-full bg-white flex flex-col z-40"
    >
      <div style={{ borderRight: '1px solid var(--border)', height: '100%', display: 'flex', flexDirection: 'column' }}>

        {/* Brand */}
        <div style={{ padding: '22px 20px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 28, height: 28, flexShrink: 0,
              background: 'var(--accent)',
              borderRadius: 7,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'Fraunces, serif',
              fontStyle: 'italic',
              fontSize: 14,
              fontWeight: 300,
              color: 'white',
              letterSpacing: '-0.03em',
            }}>
              cf
            </div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)', lineHeight: 1.15, letterSpacing: '-0.02em' }}>
                CoupleFinance
              </p>
              <p style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 2 }}>
                Leo & Serena
              </p>
            </div>
          </div>
        </div>

        <hr style={{ height: 1, background: 'var(--border)', border: 'none', margin: '0 18px' }} />

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '14px 10px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 1 }}>
          {navItems.map(({ id, label, icon: Icon }) => {
            const active = activePage === id;
            return (
              <button
                key={id}
                onClick={() => setActivePage(id)}
                className={`nav-item ${active ? 'active' : ''}`}
              >
                <Icon size={15} strokeWidth={active ? 2.2 : 1.7} style={{ flexShrink: 0, opacity: active ? 1 : 0.55 }} />
                <span>{label}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div style={{ padding: '14px 16px', borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ display: 'flex', flexShrink: 0 }}>
              <div style={{
                width: 26, height: 26, borderRadius: '50%',
                background: 'var(--accent)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontSize: 10, fontWeight: 700,
                boxShadow: '0 0 0 2px white', zIndex: 1,
              }}>L</div>
              <div style={{
                width: 26, height: 26, borderRadius: '50%',
                background: 'var(--pink)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontSize: 10, fontWeight: 700,
                marginLeft: -8, boxShadow: '0 0 0 2px white',
              }}>S</div>
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-1)', letterSpacing: '-0.01em', lineHeight: 1.2 }}>
                Leonardo & Serena
              </p>
              <p style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 1 }}>Família Silva · 2026</p>
            </div>
          </div>
        </div>

      </div>
    </aside>
  );
}
