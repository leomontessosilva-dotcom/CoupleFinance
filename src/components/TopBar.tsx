import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useStore } from '../store/useStore';
import { formatMonth, prevMonth, nextMonth } from '../utils/format';

const pageNames: Record<string, string> = {
  dashboard:    'Visão Geral',
  profiles:     'Perfis Individuais',
  transactions: 'Transações',
  fixed:        'Gastos Fixos',
  investments:  'Investimentos',
  jars:         'Cofrinhos',
  projections:  'Projeções',
};

export default function TopBar() {
  const { activePage, currentMonth, setCurrentMonth } = useStore();

  return (
    <header
      className="topbar"
      style={{
        position: 'fixed',
        top: 0,
        left: 'var(--sidebar-w)',
        right: 0,
        height: 'var(--topbar-h)',
        background: 'rgba(255,255,255,0.94)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 28px',
        zIndex: 30,
      }}
    >
      {/* Page title */}
      <h1 style={{
        fontSize: 14,
        fontWeight: 600,
        color: 'var(--text-1)',
        letterSpacing: '-0.02em',
        fontFamily: 'Plus Jakarta Sans, sans-serif',
      }}>
        {pageNames[activePage] || 'CoupleFinance'}
      </h1>

      {/* Month selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <button
          onClick={() => setCurrentMonth(prevMonth(currentMonth))}
          className="btn-ghost btn-sm"
          style={{ padding: '4px 7px', color: 'var(--text-3)' }}
        >
          <ChevronLeft size={13} />
        </button>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          padding: '5px 14px',
          border: '1px solid var(--border)',
          borderRadius: 7,
          background: 'var(--surface-2)',
        }}>
          <span className="topbar-month-text" style={{
            fontSize: 12,
            fontWeight: 600,
            color: 'var(--text-1)',
            textTransform: 'capitalize',
            minWidth: 116,
            textAlign: 'center',
            letterSpacing: '-0.01em',
          }}>
            {formatMonth(currentMonth)}
          </span>
        </div>

        <button
          onClick={() => setCurrentMonth(nextMonth(currentMonth))}
          className="btn-ghost btn-sm"
          style={{ padding: '4px 7px', color: 'var(--text-3)' }}
        >
          <ChevronRight size={13} />
        </button>
      </div>

      {/* Profile avatars */}
      <div className="topbar-profile" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ display: 'flex' }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            background: 'var(--accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontSize: 10.5, fontWeight: 700,
            boxShadow: '0 0 0 2px white', zIndex: 1,
          }}>L</div>
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            background: 'var(--pink)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontSize: 10.5, fontWeight: 700,
            marginLeft: -7, boxShadow: '0 0 0 2px white',
          }}>S</div>
        </div>
        <div style={{ lineHeight: 1 }}>
          <p style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-1)', letterSpacing: '-0.01em' }}>Leo & Serena</p>
          <p style={{ fontSize: 9.5, color: 'var(--text-3)', marginTop: 2 }}>Família Silva</p>
        </div>
      </div>
    </header>
  );
}
