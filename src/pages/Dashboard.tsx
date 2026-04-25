import { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { ArrowUpRight, ArrowDownRight, TrendingUp, CreditCard, Plus, Pencil } from 'lucide-react';
import { useStore } from '../store/useStore';
import {
  formatCurrency, formatShortDate, isInMonth,
  categoryColors, formatMonthShort, prevMonth, generateId,
} from '../utils/format';
import type { CreditCard as CreditCardType, Person } from '../types';

/* ── Premium Chart Tooltip ───────────────────────────────── */
const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'white',
      border: '1px solid var(--border)',
      borderRadius: 10,
      padding: '10px 14px',
      boxShadow: '0 8px 28px rgba(0,0,0,0.08)',
      minWidth: 160,
    }}>
      <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
        {label}
      </p>
      {payload.map((p: any) => (
        <div key={p.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, marginBottom: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: p.color, flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: 'var(--text-2)' }}>{p.name}</span>
          </div>
          <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-1)', fontFamily: 'Fraunces, serif', letterSpacing: '-0.01em' }}>
            {formatCurrency(p.value)}
          </span>
        </div>
      ))}
    </div>
  );
};

/* ── Main Dashboard ──────────────────────────────────────── */
const Skel = ({ w = 80 }: { w?: number }) => (
  <span style={{ display: 'inline-block', width: w, height: 16, borderRadius: 6, background: 'var(--border)', verticalAlign: 'middle', animation: 'pulse 1.4s ease-in-out infinite' }} />
);

export default function Dashboard() {
  const { transactions, fixedExpenses, investments, savingsJars, currentMonth, creditCards, addCreditCard, updateCreditCard, monthlyMetrics, metricsLoading } = useStore();
  const [showCCModal, setShowCCModal] = useState(false);
  const [editingCard, setEditingCard] = useState<CreditCardType | null>(null);
  const [ccForm, setCcForm] = useState({ name: '', limit: '', currentBill: '', person: 'Casal', color: '#6D28D9' });

  const openAddCC = () => {
    setEditingCard(null);
    setCcForm({ name: '', limit: '', currentBill: '', person: 'Casal', color: '#6D28D9' });
    setShowCCModal(true);
  };

  const openEditCC = (card: CreditCardType) => {
    setEditingCard(card);
    setCcForm({ name: card.name, limit: String(card.limit), currentBill: String(card.currentBill), person: card.person, color: card.color });
    setShowCCModal(true);
  };

  const saveCC = () => {
    if (!ccForm.name) return;
    if (editingCard) {
      updateCreditCard({ ...editingCard, name: ccForm.name, limit: Number(ccForm.limit) || 0, currentBill: Number(ccForm.currentBill) || 0, person: ccForm.person as Person, color: ccForm.color });
    } else {
      addCreditCard({ id: generateId(), name: ccForm.name, limit: Number(ccForm.limit) || 0, person: ccForm.person as Person, color: ccForm.color, currentBill: 0 });
    }
    setShowCCModal(false);
    setEditingCard(null);
    setCcForm({ name: '', limit: '', currentBill: '', person: 'Casal', color: '#6D28D9' });
  };

  /* All financial aggregates come from monthlyMetrics (Supabase RPC).
     Only chart-local and patrimônio totals are derived here. */
  const m = useMemo(() => {
    const mm      = monthlyMetrics;
    const income  = mm?.income       ?? 0;
    const expenses = mm?.expenses    ?? 0;
    const aportes  = mm?.aportes     ?? 0;
    const fixed    = mm?.fixed       ?? 0;
    const salaryIncome = mm?.salaryIncome ?? 0;
    const balance  = income - expenses - aportes;
    const rate     = income > 0 ? (balance / income) * 100 : 0;

    const invested         = investments.reduce((s, i) => s + i.currentValue, 0);
    const jarTotal         = mm?.jarTotal ?? savingsJars.reduce((s, j) => s + j.currentValue, 0);
    const patrimonioMes    = Math.max(0, balance);
    const patrimonioInvest = invested + jarTotal;
    const net              = patrimonioMes + patrimonioInvest;

    // Health score: savings rate (40pt) + fixed ratio (30pt) + investment wealth (30pt)
    let score = 0;
    if (rate >= 30) score += 40; else if (rate >= 20) score += 30; else if (rate >= 10) score += 20; else if (rate > 0) score += 10;
    if (income > 0) { const fr = fixed / income; if (fr < 0.3) score += 30; else if (fr < 0.4) score += 22; else if (fr < 0.5) score += 15; else if (fr < 0.7) score += 7; }
    if (income > 0) { if (invested > income * 6) score += 30; else if (invested > income * 3) score += 22; else if (invested > income) score += 15; else if (invested > 0) score += 7; }

    return { income, salaryIncome, expenses, fixed, aportes, balance, rate, invested, net, patrimonioMes, patrimonioInvest, jarTotal, score: Math.min(100, score) };
  }, [monthlyMetrics, investments, savingsJars]);

  /* 6-month chart — salary is in transactions. Aportes separated so the
     'Despesas' line reflects real spending only. */
  const chartData = useMemo(() => {
    const months: string[] = [];
    for (let i = 5; i >= 0; i--) {
      let c = currentMonth;
      for (let j = 0; j < i; j++) c = prevMonth(c);
      months.push(c);
    }
    const fixedTotal = fixedExpenses.filter((f) => f.active).reduce((s, f) => s + f.amount, 0);
    return months.map((mon) => {
      const tx = transactions.filter((t) => isInMonth(t.date, mon));
      const expensesOnly = tx.filter((t) => t.type === 'expense' && t.category !== 'Aporte').reduce((s, t) => s + t.amount, 0);
      return {
        name: formatMonthShort(mon),
        Receitas: tx.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0),
        Despesas: fixedTotal + expensesOnly,
      };
    });
  }, [transactions, fixedExpenses, currentMonth]);

  /* Recent transactions */
  const recentTx = useMemo(() =>
    [...transactions.filter((t) => isInMonth(t.date, currentMonth))]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 8),
    [transactions, currentMonth]
  );

  /* Upcoming bills */
  const upcomingBills = useMemo(() => {
    const today = new Date().getDate();
    return fixedExpenses
      .filter((f) => f.active && f.dueDay >= today)
      .sort((a, b) => a.dueDay - b.dueDay)
      .slice(0, 5);
  }, [fixedExpenses]);

  const topJars = savingsJars.slice(0, 4);
  const scoreColor = m.score >= 75 ? 'var(--green)' : m.score >= 50 ? 'var(--amber)' : 'var(--red)';
  const scoreLabel = m.score >= 75 ? 'Excelente' : m.score >= 50 ? 'Bom' : 'Atenção';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

      {/* ══ ZONE 1: Hero Patrimônio ══════════════════════════════════════ */}
      <div
        className="animate-in surface dashboard-hero-card"
        style={{ padding: '32px 36px 0', overflow: 'hidden', position: 'relative' }}
      >
        <div style={{
          position: 'absolute', top: -80, right: -80,
          width: 400, height: 400,
          background: 'radial-gradient(circle at 60% 40%, rgba(109,40,217,0.05) 0%, transparent 65%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', top: -40, right: 120,
          width: 240, height: 240,
          background: 'radial-gradient(circle, rgba(213,25,122,0.04) 0%, transparent 65%)',
          pointerEvents: 'none',
        }} />

        {/* Hero row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', position: 'relative' }}>
          <div style={{ flex: 1 }}>
            <p className="eyebrow" style={{ marginBottom: 10 }}>Patrimônio do Casal</p>
            <p className="display-hero" style={{ marginBottom: 16 }}>
              {metricsLoading ? <Skel w={160} /> : formatCurrency(m.net)}
            </p>

            {/* Patrimônio split */}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <div style={{
                background: 'rgba(109,40,217,0.06)', borderRadius: 12,
                padding: '12px 18px', minWidth: 180,
                border: '1px solid rgba(109,40,217,0.12)',
              }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>
                  Patrimônio do Mês
                </p>
                <p style={{ fontFamily: 'Fraunces, serif', fontSize: 20, fontWeight: 300, color: 'var(--text-1)', letterSpacing: '-0.02em', lineHeight: 1 }}>
                  {metricsLoading ? <Skel w={90} /> : formatCurrency(m.patrimonioMes)}
                </p>
                <p style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 4 }}>Saldo em contas de débito</p>
              </div>

              <div style={{
                background: 'rgba(4,120,87,0.06)', borderRadius: 12,
                padding: '12px 18px', minWidth: 180,
                border: '1px solid rgba(4,120,87,0.12)',
              }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--green)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>
                  Patrimônio de Investimento
                </p>
                <p style={{ fontFamily: 'Fraunces, serif', fontSize: 20, fontWeight: 300, color: 'var(--text-1)', letterSpacing: '-0.02em', lineHeight: 1 }}>
                  {metricsLoading ? <Skel w={90} /> : formatCurrency(m.patrimonioInvest)}
                </p>
                <p style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 4 }}>Cofrinhos · Investimentos</p>
              </div>
            </div>
          </div>

          {/* Score ring */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            <div style={{ position: 'relative', width: 68, height: 68 }}>
              <svg viewBox="0 0 68 68" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                <circle cx="34" cy="34" r="27" fill="none" stroke="var(--border)" strokeWidth="5" />
                <circle
                  cx="34" cy="34" r="27" fill="none"
                  stroke={scoreColor} strokeWidth="5" strokeLinecap="round"
                  strokeDasharray={`${(m.score / 100) * 169.6} 169.6`}
                />
              </svg>
              <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ fontFamily: 'Fraunces, serif', fontSize: 17, fontWeight: 400, color: 'var(--text-1)', lineHeight: 1 }}>
                  {m.score}
                </span>
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p className="eyebrow" style={{ marginBottom: 2 }}>Saúde Fin.</p>
              <p style={{ fontSize: 10.5, fontWeight: 700, color: scoreColor }}>{scoreLabel}</p>
            </div>
          </div>
        </div>

        {/* Stat chips row */}
        <div className="stat-chips-row" style={{ display: 'flex', marginTop: 28, borderTop: '1px solid var(--border)', position: 'relative' }}>
          {([
            { label: 'Receitas do Mês', value: formatCurrency(m.income),   sub: m.salaryIncome > 0 ? `Salário: ${formatCurrency(m.salaryIncome)}` : undefined, indicator: 'up',   color: 'var(--green)' },
            { label: 'Despesas do Mês', value: formatCurrency(m.expenses),  sub: m.fixed > 0 ? `Fixos: ${formatCurrency(m.fixed)}` : undefined, indicator: 'down', color: 'var(--red)' },
            { label: 'Aportes do Mês',  value: formatCurrency(m.aportes),   sub: 'p/ cofrinhos', indicator: null, color: '#059669' },
            { label: 'Saldo',           value: formatCurrency(m.balance),   sub: undefined, indicator: m.balance >= 0 ? 'up' : 'down', color: m.balance >= 0 ? 'var(--green)' : 'var(--red)' },
          ] as { label: string; value: string; sub?: string; indicator: string | null; color: string }[]).map((s, i) => (
            <div key={i} className="stat-chip" style={{ flex: 1 }}>
              <p className="eyebrow" style={{ marginBottom: 5 }}>{s.label}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                {metricsLoading
                  ? <Skel w={72} />
                  : <span className="display-num" style={{ fontSize: 17, fontWeight: 400, color: s.color }}>{s.value}</span>
                }
                {!metricsLoading && s.indicator === 'up' && <ArrowUpRight size={13} color="var(--green)" />}
                {!metricsLoading && s.indicator === 'down' && <ArrowDownRight size={13} color="var(--red)" />}
              </div>
              {s.sub && !metricsLoading && (
                <p style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 2 }}>{s.sub}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ══ ZONE 2: Chart + Right Rail ══════════════════════════════════ */}
      <div className="animate-in-1 zone-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 18 }}>

        {/* Main chart */}
        <div className="surface" style={{ padding: '24px 24px 16px', position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
            <div>
              <p className="section-title">Receitas vs Despesas</p>
              <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 3 }}>
                Últimos 6 meses · inclui salários e gastos fixos
              </p>
            </div>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--accent)' }} />
                <span style={{ fontSize: 10.5, color: 'var(--text-2)', fontWeight: 500 }}>Receitas</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--pink)' }} />
                <span style={{ fontSize: 10.5, color: 'var(--text-2)', fontWeight: 500 }}>Despesas</span>
              </div>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gInc" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#6D28D9" stopOpacity={0.12} />
                  <stop offset="100%" stopColor="#6D28D9" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gExp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#D5197A" stopOpacity={0.10} />
                  <stop offset="100%" stopColor="#D5197A" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="#F0F0F4" />
              <XAxis dataKey="name" axisLine={false} tickLine={false}
                tick={{ fontSize: 10.5, fill: '#9898A8', fontFamily: 'Plus Jakarta Sans' }} dy={8} />
              <YAxis axisLine={false} tickLine={false}
                tick={{ fontSize: 10, fill: '#9898A8', fontFamily: 'Plus Jakarta Sans' }}
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} width={32} />
              <Tooltip content={<ChartTooltip />}
                cursor={{ stroke: 'var(--border-strong)', strokeWidth: 1, strokeDasharray: '4 4' }} />
              <Area type="monotone" dataKey="Receitas" stroke="#6D28D9" strokeWidth={2} fill="url(#gInc)"
                dot={false} activeDot={{ r: 4, fill: '#6D28D9', stroke: 'white', strokeWidth: 2 }} />
              <Area type="monotone" dataKey="Despesas" stroke="#D5197A" strokeWidth={2} fill="url(#gExp)"
                dot={false} activeDot={{ r: 4, fill: '#D5197A', stroke: 'white', strokeWidth: 2 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Right rail: Upcoming bills + Credit cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

          {/* Upcoming bills */}
          <div className="surface" style={{ padding: '20px 18px' }}>
            <div className="sec-hdr" style={{ marginBottom: 14 }}>
              <p className="section-title">Próximas Contas</p>
              {upcomingBills.length > 0 && (
                <span className="pill pill-gray">{upcomingBills.length}</span>
              )}
            </div>

            {upcomingBills.length === 0 ? (
              <p style={{ fontSize: 11.5, color: 'var(--text-3)', textAlign: 'center', padding: '12px 0' }}>
                Sem contas próximas
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {upcomingBills.map((bill) => (
                  <div key={bill.id}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 8px', borderRadius: 8, transition: 'background 100ms', cursor: 'default' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-2)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 7, background: 'rgba(109,40,217,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--accent)', fontFamily: 'Fraunces, serif' }}>{bill.dueDay}</span>
                      </div>
                      <div>
                        <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-1)' }}>{bill.name}</p>
                        <p style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 1 }}>{bill.person}</p>
                      </div>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-1)', fontFamily: 'Fraunces, serif', letterSpacing: '-0.01em', flexShrink: 0 }}>
                      {formatCurrency(bill.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {upcomingBills.length > 0 && (
              <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="eyebrow">Total</span>
                <span style={{ fontFamily: 'Fraunces, serif', fontSize: 14, fontWeight: 400, color: 'var(--accent)', letterSpacing: '-0.01em' }}>
                  {formatCurrency(upcomingBills.reduce((s, b) => s + b.amount, 0))}
                </span>
              </div>
            )}
          </div>

          {/* Credit cards */}
          <div className="surface" style={{ padding: '20px 18px' }}>
            <div className="sec-hdr" style={{ marginBottom: creditCards.length > 0 ? 16 : 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <CreditCard size={14} color="var(--text-3)" />
                <p className="section-title">Cartões</p>
              </div>
              <button className="btn-ghost btn-sm" style={{ padding: '4px 8px' }} onClick={openAddCC}>
                <Plus size={12} />
              </button>
            </div>

            {creditCards.length === 0 ? (
              <button className="btn-secondary btn-sm" style={{ width: '100%', justifyContent: 'center', marginTop: 4 }} onClick={openAddCC}>
                <Plus size={12} /> Adicionar cartão
              </button>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {creditCards.map((card) => {
                  const bill   = card.currentBill;
                  const pct    = card.limit > 0 ? Math.min(100, (bill / card.limit) * 100) : 0;
                  const isOver = card.limit > 0 && bill > card.limit;
                  const barColor = isOver ? 'var(--red)' : pct > 80 ? 'var(--amber)' : card.color;
                  return (
                    <div key={card.id}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                          <div style={{ width: 7, height: 7, borderRadius: '50%', background: card.color, flexShrink: 0 }} />
                          <div>
                            <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-1)' }}>{card.name}</p>
                            <p style={{ fontSize: 10, color: 'var(--text-3)' }}>{card.person}</p>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ textAlign: 'right' }}>
                            <span style={{ fontFamily: 'Fraunces, serif', fontSize: 13, color: isOver ? 'var(--red)' : 'var(--text-1)' }}>
                              {formatCurrency(bill)}
                            </span>
                            {card.limit > 0 && (
                              <p style={{ fontSize: 9.5, color: 'var(--text-3)', marginTop: 1 }}>/ {formatCurrency(card.limit)}</p>
                            )}
                          </div>
                          <button onClick={() => openEditCC(card)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--text-3)', display: 'flex', alignItems: 'center' }}
                            title="Editar cartão">
                            <Pencil size={11} />
                          </button>
                        </div>
                      </div>
                      {card.limit > 0 && (
                        <div className="pbar pbar-lg">
                          <div className="pbar-fill" style={{ width: `${pct}%`, background: barColor }} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* ══ ZONE 3: Recent Transactions + Cofrinhos ══════════════════════ */}
      <div className="animate-in-2 zone-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 18 }}>

        {/* Recent transactions */}
        <div className="surface" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '18px 24px 14px' }} className="sec-hdr">
            <p className="section-title">Transações Recentes</p>
            <span style={{ fontSize: 10.5, color: 'var(--text-3)', fontWeight: 500 }}>Este mês</span>
          </div>

          {recentTx.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '28px 0' }}>
              <p style={{ fontSize: 12, color: 'var(--text-3)' }}>Nenhuma transação este mês</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table className="data-table" style={{ tableLayout: 'fixed', minWidth: 500 }}>
              <colgroup>
                <col style={{ width: '45%' }} />
                <col style={{ width: '20%' }} />
                <col style={{ width: '16%' }} />
                <col style={{ width: '19%' }} />
              </colgroup>
              <thead>
                <tr>
                  <th style={{ paddingLeft: 24 }}>Descrição</th>
                  <th>Categoria</th>
                  <th>Pessoa</th>
                  <th style={{ textAlign: 'right', paddingRight: 24 }}>Valor</th>
                </tr>
              </thead>
              <tbody>
                {recentTx.map((tx) => (
                  <tr key={tx.id}>
                    <td style={{ paddingLeft: 24 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 26, height: 26, borderRadius: 7, flexShrink: 0, background: `${categoryColors[tx.category] || '#9898A8'}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: categoryColors[tx.category] || '#9898A8' }}>
                            {tx.category.charAt(0)}
                          </span>
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <p style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {tx.description}
                          </p>
                          <p style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 1 }}>{formatShortDate(tx.date)}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="pill" style={{ background: `${categoryColors[tx.category] || '#9898A8'}12`, color: categoryColors[tx.category] || '#9898A8', fontSize: 10.5 }}>
                        {tx.category}
                      </span>
                    </td>
                    <td>
                      <span className={`pill ${tx.person === 'Leonardo' ? 'pill-purple' : tx.person === 'Serena' ? 'pill-pink' : 'pill-gray'}`} style={{ fontSize: 10.5 }}>
                        {tx.person === 'Leonardo' ? 'Leo' : tx.person === 'Serena' ? 'Sere' : tx.person}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right', paddingRight: 24 }}>
                      <span style={{ fontFamily: 'Fraunces, serif', fontSize: 13, fontWeight: 400, letterSpacing: '-0.01em', color: tx.type === 'income' ? 'var(--green)' : 'var(--red)' }}>
                        {tx.type === 'income' ? '+' : '−'}{formatCurrency(tx.amount)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          )}
        </div>

        {/* Cofrinhos */}
        <div className="surface" style={{ padding: '20px 22px' }}>
          <div className="sec-hdr">
            <p className="section-title">Cofrinhos</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <TrendingUp size={11} color="var(--green)" />
              <span style={{ fontSize: 10.5, color: 'var(--green)', fontWeight: 600 }}>
                {formatCurrency(savingsJars.reduce((s, j) => s + j.currentValue, 0))}
              </span>
            </div>
          </div>

          {topJars.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <p style={{ fontSize: 11.5, color: 'var(--text-3)' }}>Nenhum cofrinho cadastrado</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {topJars.map((jar) => {
                const pct       = Math.min(100, (jar.currentValue / jar.targetValue) * 100);
                const remaining = jar.targetValue - jar.currentValue;
                const months    = jar.monthlyContribution > 0 ? Math.ceil(remaining / jar.monthlyContribution) : null;
                return (
                  <div key={jar.id}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                        <span style={{ fontSize: 17, lineHeight: 1, flexShrink: 0 }}>{jar.emoji}</span>
                        <div style={{ minWidth: 0 }}>
                          <p style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {jar.name}
                          </p>
                          {months !== null && (
                            <p style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 1 }}>
                              ~{months} {months === 1 ? 'mês' : 'meses'} p/ concluir
                            </p>
                          )}
                        </div>
                      </div>
                      <span style={{ fontFamily: 'Fraunces, serif', fontSize: 13, fontWeight: 400, color: jar.color, letterSpacing: '-0.01em', flexShrink: 0 }}>
                        {pct.toFixed(0)}%
                      </span>
                    </div>
                    <div className="pbar pbar-lg">
                      <div className="pbar-fill" style={{ width: `${pct}%`, background: jar.color }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
                      <span style={{ fontSize: 10.5, color: 'var(--text-3)', fontFamily: 'Fraunces, serif' }}>{formatCurrency(jar.currentValue)}</span>
                      <span style={{ fontSize: 10.5, color: 'var(--text-3)', fontFamily: 'Fraunces, serif' }}>{formatCurrency(jar.targetValue)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ══ Add / Edit CC Modal ════════════════════════════════════════════════ */}
      {showCCModal && createPortal(
        <div className="modal-overlay" onClick={() => setShowCCModal(false)}>
          <div className="modal-panel" onClick={e => e.stopPropagation()}>
            <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.2rem', fontWeight: 300, marginBottom: 20, color: 'var(--text-1)', letterSpacing: '-0.02em' }}>
              {editingCard ? 'Editar Cartão' : 'Novo Cartão de Crédito'}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label className="f-label">Nome do cartão</label>
                <input className="input" placeholder="Ex: Nubank Leo" value={ccForm.name}
                  onChange={e => setCcForm({ ...ccForm, name: e.target.value })} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label className="f-label">Limite (R$)</label>
                  <input type="number" className="input" placeholder="0,00" value={ccForm.limit}
                    onChange={e => setCcForm({ ...ccForm, limit: e.target.value })} />
                </div>
                <div>
                  <label className="f-label">Responsável</label>
                  <select className="input" value={ccForm.person}
                    onChange={e => setCcForm({ ...ccForm, person: e.target.value })}>
                    <option>Leonardo</option>
                    <option>Serena</option>
                    <option>Casal</option>
                  </select>
                </div>
              </div>
              {editingCard && (
                <div>
                  <label className="f-label">Fatura Atual (R$)</label>
                  <input type="number" className="input" placeholder="0,00" value={ccForm.currentBill}
                    onChange={e => setCcForm({ ...ccForm, currentBill: e.target.value })} />
                  <p style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 4 }}>
                    Valor total da fatura atual. Atualizado automaticamente ao lançar gastos.
                  </p>
                </div>
              )}
              <div>
                <label className="f-label">Cor</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {['#6D28D9', '#D5197A', '#047857', '#B45309', '#1D4ED8', '#DC2626'].map(c => (
                    <div key={c} onClick={() => setCcForm({ ...ccForm, color: c })}
                      style={{ width: 22, height: 22, borderRadius: '50%', background: c, cursor: 'pointer', boxShadow: ccForm.color === c ? `0 0 0 2px white, 0 0 0 3px ${c}` : 'none', transition: 'box-shadow 100ms' }} />
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, paddingTop: 4 }}>
                <button className="btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={saveCC}>
                  Salvar
                </button>
                <button className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setShowCCModal(false)}>
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}
