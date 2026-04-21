import { useMemo } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { ArrowUpRight, ArrowDownRight, TrendingUp } from 'lucide-react';
import { useStore } from '../store/useStore';
import {
  formatCurrency, formatShortDate, isInMonth,
  categoryColors, formatMonthShort, prevMonth,
} from '../utils/format';

/* ── Premium Tooltip ─────────────────────────────────── */
const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'white',
      border: '1px solid var(--border)',
      borderRadius: 10,
      padding: '10px 14px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.10)',
      minWidth: 160,
    }}>
      <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>
        {label}
      </p>
      {payload.map((p: any) => (
        <div key={p.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, marginBottom: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: p.color, flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: 'var(--text-2)' }}>{p.name}</span>
          </div>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)', fontFamily: 'Fraunces, serif' }}>
            {formatCurrency(p.value)}
          </span>
        </div>
      ))}
    </div>
  );
};

/* ── Main Dashboard ──────────────────────────────────── */
export default function Dashboard() {
  const { transactions, fixedExpenses, investments, savingsJars, currentMonth } = useStore();

  /* Compute month-level aggregates */
  const m = useMemo(() => {
    const tx = transactions.filter((t) => isInMonth(t.date, currentMonth));
    const income   = tx.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expenses = tx.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const fixed    = fixedExpenses.filter((f) => f.active).reduce((s, f) => s + f.amount, 0);
    const balance  = income - expenses;
    const rate     = income > 0 ? (balance / income) * 100 : 0;
    const invested = investments.reduce((s, i) => s + i.currentValue, 0);
    const jars     = savingsJars.reduce((s, j) => s + j.currentValue, 0);
    const net      = invested + jars + Math.max(0, balance);

    let score = 50;
    if (rate >= 20) score += 20; else if (rate >= 10) score += 10;
    if (fixed < income * 0.5) score += 15;
    if (invested > income * 3) score += 15;

    return { income, expenses, fixed, balance, rate, invested, jars, net, score: Math.min(100, score) };
  }, [transactions, fixedExpenses, investments, savingsJars, currentMonth]);

  /* 6-month chart data */
  const chartData = useMemo(() => {
    const months: string[] = [];
    for (let i = 5; i >= 0; i--) {
      let c = currentMonth;
      for (let j = 0; j < i; j++) c = prevMonth(c);
      months.push(c);
    }
    return months.map((mon) => {
      const tx = transactions.filter((t) => isInMonth(t.date, mon));
      return {
        name: formatMonthShort(mon),
        Receitas: tx.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0),
        Despesas: tx.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
      };
    });
  }, [transactions, currentMonth]);

  /* Recent transactions (current month) */
  const recentTx = useMemo(() =>
    [...transactions.filter((t) => isInMonth(t.date, currentMonth))]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 7),
    [transactions, currentMonth]
  );

  /* Upcoming bills */
  const upcomingBills = useMemo(() => {
    const today = new Date().getDate();
    return fixedExpenses
      .filter((f) => f.active && f.dueDay >= today)
      .sort((a, b) => a.dueDay - b.dueDay)
      .slice(0, 6);
  }, [fixedExpenses]);

  const topJars = savingsJars.slice(0, 4);

  const scoreColor = m.score >= 75 ? 'var(--green)' : m.score >= 50 ? 'var(--amber)' : 'var(--red)';
  const scoreLabel = m.score >= 75 ? 'Excelente' : m.score >= 50 ? 'Bom' : 'Atenção';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── ZONE 1: Hero Patrimônio ─────────────────────────────────────── */}
      <div
        className="animate-in surface"
        style={{
          padding: '28px 32px 0',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Faint radial glow top-right */}
        <div style={{
          position: 'absolute', top: -60, right: -60,
          width: 320, height: 320,
          background: 'radial-gradient(circle, rgba(109,40,217,0.06) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        {/* Top row: big number + score ring */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <p className="eyebrow" style={{ marginBottom: 8 }}>Patrimônio Líquido</p>
            <p className="display-hero" style={{ marginBottom: 6 }}>
              {formatCurrency(m.net)}
            </p>
            <p style={{ fontSize: 12, color: 'var(--text-3)' }}>
              Investimentos + Cofrinhos + Saldo disponível
            </p>
          </div>

          {/* Score ring */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            <div style={{ position: 'relative', width: 72, height: 72 }}>
              <svg viewBox="0 0 72 72" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                <circle cx="36" cy="36" r="28" fill="none" stroke="var(--border)" strokeWidth="6" />
                <circle
                  cx="36" cy="36" r="28" fill="none"
                  stroke={scoreColor} strokeWidth="6" strokeLinecap="round"
                  strokeDasharray={`${(m.score / 100) * 175.9} 175.9`}
                />
              </svg>
              <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ fontFamily: 'Fraunces, serif', fontSize: 18, fontWeight: 400, color: 'var(--text-1)', lineHeight: 1 }}>{m.score}</span>
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p className="eyebrow">Saúde Fin.</p>
              <p style={{ fontSize: 11, fontWeight: 700, color: scoreColor, marginTop: 1 }}>{scoreLabel}</p>
            </div>
          </div>
        </div>

        {/* Stat chips row */}
        <div style={{ display: 'flex', marginTop: 24, borderTop: '1px solid var(--border)' }}>
          {[
            { label: 'Receitas do Mês', value: formatCurrency(m.income), up: true, color: 'var(--green)' },
            { label: 'Despesas do Mês', value: formatCurrency(m.expenses), up: false, color: 'var(--red)' },
            { label: 'Saldo', value: formatCurrency(m.balance), up: m.balance >= 0, color: m.balance >= 0 ? 'var(--green)' : 'var(--red)' },
            { label: 'Taxa de Poupança', value: `${m.rate.toFixed(1)}%`, up: m.rate >= 20, color: m.rate >= 20 ? 'var(--green)' : m.rate >= 10 ? 'var(--amber)' : 'var(--red)' },
            { label: 'Gastos Fixos', value: formatCurrency(m.fixed), up: null, color: 'var(--text-2)' },
            { label: 'Total Investido', value: formatCurrency(m.invested), up: true, color: 'var(--accent)' },
          ].map((s, i) => (
            <div key={i} className="stat-chip" style={{ flex: 1 }}>
              <p className="eyebrow" style={{ marginBottom: 4 }}>{s.label}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span
                  className="display-num"
                  style={{ fontSize: 18, fontWeight: 400, color: s.color }}
                >
                  {s.value}
                </span>
                {s.up !== null && (
                  s.up
                    ? <ArrowUpRight size={14} color="var(--green)" />
                    : <ArrowDownRight size={14} color="var(--red)" />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── ZONE 2: Featured Chart + Bills ──────────────────────────────── */}
      <div className="animate-in-1" style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20 }}>

        {/* The main chart */}
        <div className="surface" style={{ padding: '24px 24px 16px', position: 'relative' }}>
          <div className="sec-hdr" style={{ marginBottom: 24 }}>
            <div>
              <p className="section-title">Receitas vs Despesas</p>
              <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 3 }}>Evolução dos últimos 6 meses</p>
            </div>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)' }} />
                <span style={{ fontSize: 11, color: 'var(--text-2)' }}>Receitas</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--pink)' }} />
                <span style={{ fontSize: 11, color: 'var(--text-2)' }}>Despesas</span>
              </div>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gInc" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6D28D9" stopOpacity={0.12} />
                  <stop offset="100%" stopColor="#6D28D9" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gExp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#D5197A" stopOpacity={0.10} />
                  <stop offset="100%" stopColor="#D5197A" stopOpacity={0} />
                </linearGradient>
              </defs>

              {/* Very subtle horizontal guides only */}
              <CartesianGrid
                vertical={false}
                stroke="#EBEBEF"
                strokeDasharray="0"
              />

              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: '#9898A8', fontFamily: 'Plus Jakarta Sans' }}
                dy={8}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10.5, fill: '#9898A8', fontFamily: 'Plus Jakarta Sans' }}
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                width={34}
              />

              <Tooltip
                content={<ChartTooltip />}
                cursor={{ stroke: 'var(--border-strong)', strokeWidth: 1, strokeDasharray: '4 4' }}
              />

              <Area
                type="monotone"
                dataKey="Receitas"
                stroke="#6D28D9"
                strokeWidth={2}
                fill="url(#gInc)"
                dot={false}
                activeDot={{ r: 4, fill: '#6D28D9', stroke: 'white', strokeWidth: 2 }}
              />
              <Area
                type="monotone"
                dataKey="Despesas"
                stroke="#D5197A"
                strokeWidth={2}
                fill="url(#gExp)"
                dot={false}
                activeDot={{ r: 4, fill: '#D5197A', stroke: 'white', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Upcoming bills */}
        <div className="surface" style={{ padding: '24px 20px' }}>
          <div className="sec-hdr">
            <p className="section-title">Próximas Contas</p>
            <span className="pill pill-purple">{upcomingBills.length}</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {upcomingBills.map((bill) => (
              <div
                key={bill.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '9px 10px',
                  borderRadius: 8,
                  cursor: 'default',
                  transition: 'background 100ms',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-2)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {/* Day badge */}
                  <div style={{
                    width: 32, height: 32, borderRadius: 8,
                    background: 'var(--accent-bg)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', fontFamily: 'Fraunces, serif' }}>
                      {bill.dueDay}
                    </span>
                  </div>
                  <div>
                    <p style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-1)' }}>{bill.name}</p>
                    <p style={{ fontSize: 10.5, color: 'var(--text-3)', marginTop: 1 }}>{bill.person}</p>
                  </div>
                </div>
                <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-1)', fontFamily: 'Fraunces, serif', letterSpacing: '-0.01em', flexShrink: 0 }}>
                  {formatCurrency(bill.amount)}
                </span>
              </div>
            ))}
          </div>

          {/* Total upcoming */}
          <div style={{
            marginTop: 12,
            paddingTop: 12,
            borderTop: '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total</span>
            <span style={{ fontFamily: 'Fraunces, serif', fontSize: 16, fontWeight: 400, color: 'var(--accent)', letterSpacing: '-0.01em' }}>
              {formatCurrency(upcomingBills.reduce((s, b) => s + b.amount, 0))}
            </span>
          </div>
        </div>
      </div>

      {/* ── ZONE 3: Transactions + Cofrinhos ────────────────────────────── */}
      <div className="animate-in-2" style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 20 }}>

        {/* Recent transactions */}
        <div className="surface" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px 16px' }} className="sec-hdr">
            <p className="section-title">Transações Recentes</p>
            <span style={{ fontSize: 11, color: 'var(--text-3)' }}>Este mês</span>
          </div>

          <table className="data-table" style={{ tableLayout: 'fixed' }}>
            <colgroup>
              <col style={{ width: '46%' }} />
              <col style={{ width: '20%' }} />
              <col style={{ width: '16%' }} />
              <col style={{ width: '18%' }} />
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
                      <div style={{
                        width: 28, height: 28, borderRadius: 7, flexShrink: 0,
                        background: `${categoryColors[tx.category] || '#9898A8'}18`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: categoryColors[tx.category] || '#9898A8' }}>
                          {tx.category.charAt(0)}
                        </span>
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {tx.description}
                        </p>
                        <p style={{ fontSize: 10.5, color: 'var(--text-3)', marginTop: 1 }}>{formatShortDate(tx.date)}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span
                      className="pill"
                      style={{
                        background: `${categoryColors[tx.category] || '#9898A8'}14`,
                        color: categoryColors[tx.category] || '#9898A8',
                        fontSize: 10.5,
                      }}
                    >
                      {tx.category}
                    </span>
                  </td>
                  <td>
                    <span className={`pill ${tx.person === 'Leonardo' ? 'pill-purple' : tx.person === 'Serena' ? 'pill-pink' : 'pill-gray'}`} style={{ fontSize: 10.5 }}>
                      {tx.person}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right', paddingRight: 24 }}>
                    <span style={{
                      fontFamily: 'Fraunces, serif',
                      fontSize: 13.5,
                      fontWeight: 400,
                      letterSpacing: '-0.01em',
                      color: tx.type === 'income' ? 'var(--green)' : 'var(--red)',
                    }}>
                      {tx.type === 'income' ? '+' : '−'}{formatCurrency(tx.amount)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Cofrinhos */}
        <div className="surface" style={{ padding: '20px 24px' }}>
          <div className="sec-hdr">
            <p className="section-title">Cofrinhos</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <TrendingUp size={12} color="var(--green)" />
              <span style={{ fontSize: 11, color: 'var(--green)', fontWeight: 600 }}>
                {formatCurrency(savingsJars.reduce((s, j) => s + j.currentValue, 0))} guardados
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {topJars.map((jar) => {
              const pct = Math.min(100, (jar.currentValue / jar.targetValue) * 100);
              const remaining = jar.targetValue - jar.currentValue;
              const months = jar.monthlyContribution > 0
                ? Math.ceil(remaining / jar.monthlyContribution)
                : null;

              return (
                <div key={jar.id}>
                  {/* Header row */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                      <span style={{ fontSize: 18, lineHeight: 1, flexShrink: 0 }}>{jar.emoji}</span>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {jar.name}
                        </p>
                        {months !== null && (
                          <p style={{ fontSize: 10.5, color: 'var(--text-3)', marginTop: 1 }}>
                            ~{months} {months === 1 ? 'mês' : 'meses'} p/ concluir
                          </p>
                        )}
                      </div>
                    </div>
                    <span style={{ fontFamily: 'Fraunces, serif', fontSize: 13, fontWeight: 400, color: jar.color, letterSpacing: '-0.01em', flexShrink: 0 }}>
                      {pct.toFixed(0)}%
                    </span>
                  </div>

                  {/* Progress */}
                  <div className="pbar pbar-lg">
                    <div className="pbar-fill" style={{ width: `${pct}%`, background: jar.color }} />
                  </div>

                  {/* Sub values */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
                    <span style={{ fontSize: 10.5, color: 'var(--text-3)', fontFamily: 'Fraunces, serif' }}>
                      {formatCurrency(jar.currentValue)}
                    </span>
                    <span style={{ fontSize: 10.5, color: 'var(--text-3)', fontFamily: 'Fraunces, serif' }}>
                      {formatCurrency(jar.targetValue)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

    </div>
  );
}
