import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useStore } from '../store/useStore';
import { formatMonth, prevMonth, nextMonth } from '../utils/format';

const pageNames: Record<string, string> = {
  dashboard: 'Visão Geral',
  profiles: 'Perfis Individuais',
  transactions: 'Transações',
  fixed: 'Gastos Fixos',
  investments: 'Investimentos',
  jars: 'Cofrinhos',
  projections: 'Projeções',
};

export default function TopBar() {
  const { activePage, currentMonth, setCurrentMonth } = useStore();

  return (
    <header
      style={{
        position: 'fixed',
        top: 0,
        left: 'var(--sidebar-w)',
        right: 0,
        height: 'var(--topbar-h)',
        background: 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 32px',
        zIndex: 30,
      }}
    >
      {/* Page title */}
      <h1 style={{
        fontFamily: 'Plus Jakarta Sans, sans-serif',
        fontSize: 15,
        fontWeight: 700,
        color: 'var(--text-1)',
        letterSpacing: '-0.01em',
      }}>
        {pageNames[activePage] || 'CoupleFinance'}
      </h1>

      {/* Month selector — editorial style */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button
          onClick={() => setCurrentMonth(prevMonth(currentMonth))}
          className="btn-ghost btn-sm"
          style={{ padding: '5px 8px' }}
        >
          <ChevronLeft size={14} />
        </button>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '5px 14px',
          background: 'var(--surface-2)',
          border: '1px solid var(--border)',
          borderRadius: 8,
        }}>
          <span style={{
            fontSize: 12.5,
            fontWeight: 600,
            color: 'var(--text-1)',
            textTransform: 'capitalize',
            minWidth: 120,
            textAlign: 'center',
            letterSpacing: '-0.01em',
          }}>
            {formatMonth(currentMonth)}
          </span>
        </div>

        <button
          onClick={() => setCurrentMonth(nextMonth(currentMonth))}
          className="btn-ghost btn-sm"
          style={{ padding: '5px 8px' }}
        >
          <ChevronRight size={14} />
        </button>
      </div>

      {/* Profile */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'flex' }}>
            <div
              style={{
                width: 30, height: 30, borderRadius: '50%',
                background: 'var(--accent)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontSize: 11, fontWeight: 700,
                boxShadow: '0 0 0 2px white',
                zIndex: 1,
              }}
            >L</div>
            <div
              style={{
                width: 30, height: 30, borderRadius: '50%',
                background: 'var(--pink)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontSize: 11, fontWeight: 700,
                marginLeft: -8,
                boxShadow: '0 0 0 2px white',
              }}
            >S</div>
          </div>
          <div>
            <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-1)', lineHeight: 1 }}>Leo & Serena</p>
            <p style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 2 }}>Família Silva</p>
          </div>
        </div>
      </div>
    </header>
  );
}
