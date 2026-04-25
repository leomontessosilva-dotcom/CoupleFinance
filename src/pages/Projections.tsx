import { useState, useMemo } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import { useStore } from '../store/useStore';
import { formatCurrency, prevMonth, formatMonthShort, getSalaryForMonth } from '../utils/format';
import type { SavingsJar, Transaction } from '../types';

/* ── Helpers ──────────────────────────────────────────────── */

// CDI aproximado de abril 2026 (Selic - 0,10 p.p.)
const CDI_ANUAL = 14.65;

function toMonthlyRate(rate: number, period: string): number {
  if (period === 'cdi') {
    // rate = X% do CDI → taxa efetiva anual = (X/100) × CDI
    const anual = (rate / 100) * (CDI_ANUAL / 100);
    return Math.pow(1 + anual, 1 / 12) - 1;
  }
  const r = rate / 100;
  if (period === 'diário')  return Math.pow(1 + r, 30) - 1;
  if (period === 'anual')   return Math.pow(1 + r, 1 / 12) - 1;
  return r;
}

function jarFutureValue(jar: SavingsJar, months: number): number {
  if (!jar.yieldRate || jar.yieldRate <= 0) {
    return jar.currentValue + jar.monthlyContribution * months;
  }
  const r = toMonthlyRate(jar.yieldRate, jar.yieldPeriod ?? 'mensal');
  const pv = jar.currentValue;
  const pmt = jar.monthlyContribution;
  const growth = Math.pow(1 + r, months);
  return pv * growth + (r > 0 ? pmt * (growth - 1) / r : pmt * months);
}

function jarInterestEarned(jar: SavingsJar, months: number): number {
  const fv = jarFutureValue(jar, months);
  return fv - jar.currentValue - jar.monthlyContribution * months;
}

/** Returns last N months as 'YYYY-MM' strings, most recent last */
function lastNMonths(currentMonth: string, n: number): string[] {
  const months: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    let m = currentMonth;
    for (let j = 0; j < i; j++) m = prevMonth(m);
    months.push(m);
  }
  return months;
}

/** Actual contributions for a jar in a given month (YYYY-MM).
 *  Depósito = type 'expense' → POSITIVO (dinheiro entrou no cofrinho)
 *  Retirada = type 'income'  → NEGATIVO (dinheiro saiu do cofrinho)
 */
function actualForMonth(jar: SavingsJar, txs: Transaction[], ym: string): number {
  return txs
    .filter((t) => t.savingsJarId === jar.id && t.date.startsWith(ym))
    .reduce((sum, t) => sum + (t.type === 'expense' ? t.amount : -t.amount), 0);
}

/* ── Custom Tooltip ───────────────────────────────────────── */
const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'white', border: '1px solid var(--border)',
      borderRadius: 10, padding: '10px 14px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.10)', minWidth: 180,
    }}>
      <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>
        {label}
      </p>
      {payload.map((p: any) => (
        <div key={p.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: p.color }} />
            <span style={{ fontSize: 11, color: 'var(--text-2)' }}>{p.name}</span>
          </div>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-1)', fontFamily: 'Fraunces, serif' }}>
            {formatCurrency(p.value)}
          </span>
        </div>
      ))}
    </div>
  );
};

/* ── Main Page ────────────────────────────────────────────── */
export default function Projections() {
  const { savingsJars, transactions, currentMonth, salaryHistory, fixedExpenses } = useStore();
  const [horizon, setHorizon] = useState<6 | 12 | 24 | 36>(12);

  const jarsWithYield = savingsJars.filter((j) => j.yieldRate && j.yieldRate > 0);
  const jarsNoYield   = savingsJars.filter((j) => !j.yieldRate || j.yieldRate === 0);

  const HISTORY_MONTHS = 6;
  const historyMonths = useMemo(
    () => lastNMonths(currentMonth, HISTORY_MONTHS),
    [currentMonth]
  );

  /* Build month-by-month chart data */
  const chartData = useMemo(() => {
    const data: any[] = [];
    for (let m = 1; m <= horizon; m++) {
      const d = new Date();
      d.setMonth(d.getMonth() + m);
      const label = d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });

      const row: any = { month: label };
      let total = 0;
      savingsJars.forEach((jar) => {
        const fv = jarFutureValue(jar, m);
        row[jar.name] = Math.round(fv);
        total += fv;
      });
      row['Total'] = Math.round(total);
      data.push(row);
    }
    return data;
  }, [savingsJars, horizon]);

  /* Summary at end of horizon */
  const summary = useMemo(() => {
    return savingsJars.map((jar) => {
      const fv = jarFutureValue(jar, horizon);
      const interest = jarInterestEarned(jar, horizon);
      const totalContrib = jar.monthlyContribution * horizon;
      const monthlyRate = jar.yieldRate
        ? toMonthlyRate(jar.yieldRate, jar.yieldPeriod ?? 'mensal') * 100
        : 0;
      return { jar, fv, interest, totalContrib, monthlyRate };
    });
  }, [savingsJars, horizon]);

  /* Compliance per jar per month */
  const compliance = useMemo(() => {
    return savingsJars
      .filter((j) => j.monthlyContribution > 0)
      .map((jar) => {
        const months = historyMonths.map((ym) => {
          const actual = actualForMonth(jar, transactions, ym);
          const planned = jar.monthlyContribution;
          const delta = actual - planned;
          const hasData = transactions.some((t) => t.savingsJarId === jar.id && t.date.startsWith(ym));
          return { ym, label: formatMonthShort(ym), actual, planned, delta, hasData };
        });
        const tracked = months.filter((m) => m.hasData);
        const totalDeficit = tracked.reduce((s, m) => s + (m.delta < 0 ? -m.delta : 0), 0);
        const totalSurplus = tracked.reduce((s, m) => s + (m.delta > 0 ? m.delta : 0), 0);
        return { jar, months, totalDeficit, totalSurplus, tracked };
      });
  }, [savingsJars, transactions, historyMonths]);

  const totalFV       = summary.reduce((s, r) => s + r.fv, 0);
  const totalInterest = summary.reduce((s, r) => s + r.interest, 0);
  const totalContrib  = summary.reduce((s, r) => s + r.totalContrib, 0);

  const COLORS = ['#6D28D9', '#D5197A', '#047857', '#B45309', '#1D4ED8', '#DC2626', '#8B5CF6', '#10B981'];

  // Cash flow projection: salary + jar yields vs fixed expenses
  const monthlyIncome = getSalaryForMonth(salaryHistory.Leonardo, currentMonth) + getSalaryForMonth(salaryHistory.Serena, currentMonth);
  const monthlyFixed = fixedExpenses.filter((f) => f.active).reduce((s, f) => s + f.amount, 0);
  const monthlyJarContribs = savingsJars.reduce((s, j) => s + j.monthlyContribution, 0);
  const monthlyCashFlow = monthlyIncome - monthlyFixed - monthlyJarContribs;

  const cashFlowData = useMemo(() => {
    const data: { month: string; Entradas: number; Saídas: number; Saldo: number }[] = [];
    let accumulated = 0;
    for (let m = 1; m <= horizon; m++) {
      const d = new Date();
      d.setMonth(d.getMonth() + m);
      const label = d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
      // Yield income from jars
      const jarYields = savingsJars.reduce((s, jar) => {
        if (!jar.yieldRate || jar.yieldRate <= 0) return s;
        const r = toMonthlyRate(jar.yieldRate, jar.yieldPeriod ?? 'mensal');
        const fvPrev = jarFutureValue(jar, m - 1);
        return s + fvPrev * r;
      }, 0);
      const inflow = monthlyIncome + jarYields;
      const outflow = monthlyFixed + monthlyJarContribs;
      accumulated += inflow - outflow;
      data.push({ month: label, Entradas: Math.round(inflow), Saídas: Math.round(outflow), Saldo: Math.round(accumulated) });
    }
    return data;
  }, [horizon, savingsJars, monthlyIncome, monthlyFixed, monthlyJarContribs]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }} className="animate-fade-in">

      {/* Controls */}
      <div className="surface" style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)', marginRight: 4 }}>Horizonte:</p>
        <div className="tab-bar" style={{ width: 'auto' }}>
          {([6, 12, 24, 36] as const).map((h) => (
            <button key={h} className={`tab-btn ${horizon === h ? 'active' : ''}`} onClick={() => setHorizon(h)}>
              {h} meses
            </button>
          ))}
        </div>

        {savingsJars.length === 0 && (
          <p style={{ fontSize: 12, color: 'var(--text-3)', marginLeft: 12 }}>
            Adicione cofrinhos com rendimento para ver projeções.
          </p>
        )}
      </div>

      {/* Summary hero cards */}
      {savingsJars.length > 0 && (
        <div className="surface" style={{ padding: '0', overflow: 'hidden' }}>
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
            {[
              { label: `Total em ${horizon} meses`, value: formatCurrency(totalFV), color: 'var(--accent)' },
              { label: 'Rendimentos acumulados', value: formatCurrency(totalInterest), color: 'var(--green)' },
              { label: 'Total aportado', value: formatCurrency(totalContrib + savingsJars.reduce((s, j) => s + j.currentValue, 0)), color: 'var(--text-2)' },
            ].map((s, i) => (
              <div key={i} className="stat-chip" style={{ flex: 1 }}>
                <p className="eyebrow" style={{ marginBottom: 6 }}>{s.label}</p>
                <p style={{ fontFamily: 'Fraunces, serif', fontSize: '1.6rem', fontWeight: 300, letterSpacing: '-0.02em', color: s.color, lineHeight: 1 }}>
                  {s.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Chart */}
      {savingsJars.length > 0 && (
        <div className="surface" style={{ padding: '24px 24px 16px' }}>
          <div className="sec-hdr" style={{ marginBottom: 24 }}>
            <div>
              <p className="section-title">Evolução dos Cofrinhos</p>
              <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 3 }}>
                Com rendimento composto · {horizon} meses
              </p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <defs>
                {savingsJars.map((jar, i) => (
                  <linearGradient key={jar.id} id={`g${i}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={jar.color || COLORS[i % COLORS.length]} stopOpacity={0.15} />
                    <stop offset="100%" stopColor={jar.color || COLORS[i % COLORS.length]} stopOpacity={0} />
                  </linearGradient>
                ))}
                <linearGradient id="gTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.10} />
                  <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="#EBEBEF" />
              <XAxis dataKey="month" axisLine={false} tickLine={false}
                tick={{ fontSize: 11, fill: '#9898A8', fontFamily: 'Plus Jakarta Sans' }} dy={8} />
              <YAxis axisLine={false} tickLine={false}
                tick={{ fontSize: 10.5, fill: '#9898A8', fontFamily: 'Plus Jakarta Sans' }}
                tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} width={40} />
              <Tooltip content={<ChartTooltip />}
                cursor={{ stroke: 'var(--border-strong)', strokeWidth: 1, strokeDasharray: '4 4' }} />
              <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 11, paddingTop: 16 }} />
              {savingsJars.map((jar, i) => (
                <Area key={jar.id} type="monotone" dataKey={jar.name}
                  stroke={jar.color || COLORS[i % COLORS.length]} strokeWidth={1.5}
                  fill={`url(#g${i})`} dot={false}
                  activeDot={{ r: 3, stroke: 'white', strokeWidth: 2 }} />
              ))}
              <Area type="monotone" dataKey="Total" stroke="var(--accent)" strokeWidth={2.5}
                fill="url(#gTotal)" dot={false}
                activeDot={{ r: 4, fill: 'var(--accent)', stroke: 'white', strokeWidth: 2 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Per-jar breakdown table */}
      {summary.length > 0 && (
        <div className="surface" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px 16px' }}>
            <p className="section-title">Detalhamento por Cofrinho</p>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ paddingLeft: 24 }}>Cofrinho</th>
                  <th>Taxa Efetiva/mês</th>
                  <th>Meta Mensal</th>
                  <th>Valor Atual</th>
                  <th style={{ textAlign: 'right' }}>Em {horizon} meses</th>
                  <th style={{ textAlign: 'right', paddingRight: 24 }}>Rendimento</th>
                </tr>
              </thead>
              <tbody>
                {summary.map(({ jar, fv, interest, monthlyRate }) => (
                  <tr key={jar.id}>
                    <td style={{ paddingLeft: 24 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 18 }}>{jar.emoji}</span>
                        <div>
                          <p style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-1)' }}>{jar.name}</p>
                          {jar.yieldRate ? (
                            <p style={{ fontSize: 10.5, color: 'var(--text-3)' }}>
                              {jar.yieldRate}% {jar.yieldPeriod}
                            </p>
                          ) : (
                            <p style={{ fontSize: 10.5, color: 'var(--text-3)' }}>Sem rendimento</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      {monthlyRate > 0 ? (
                        <div>
                          <span className="pill pill-green" style={{ fontSize: 11 }}>
                            {monthlyRate.toFixed(3)}%/mês
                          </span>
                          <p style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 3 }}>
                            {((Math.pow(1 + monthlyRate/100, 12) - 1) * 100).toFixed(2)}% a.a. ef.
                          </p>
                        </div>
                      ) : (
                        <span style={{ fontSize: 11, color: 'var(--text-3)' }}>—</span>
                      )}
                    </td>
                    <td style={{ fontFamily: 'Fraunces, serif', fontSize: 13 }}>{formatCurrency(jar.monthlyContribution)}</td>
                    <td style={{ fontFamily: 'Fraunces, serif', fontSize: 13 }}>{formatCurrency(jar.currentValue)}</td>
                    <td style={{ textAlign: 'right' }}>
                      <span style={{ fontFamily: 'Fraunces, serif', fontSize: 14, fontWeight: 400, color: 'var(--accent)', letterSpacing: '-0.01em' }}>
                        {formatCurrency(fv)}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right', paddingRight: 24 }}>
                      <span style={{ fontFamily: 'Fraunces, serif', fontSize: 13, color: interest > 0 ? 'var(--green)' : 'var(--text-3)' }}>
                        {interest > 0 ? '+' : ''}{formatCurrency(interest)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Compliance history — last 6 months */}
      {compliance.length > 0 && (
        <div className="surface" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p className="section-title">Histórico de Aportes</p>
              <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 3 }}>
                Últimos {HISTORY_MONTHS} meses · meta vs realizado
              </p>
            </div>
          </div>

          {compliance.map(({ jar, months, totalDeficit, totalSurplus, tracked }) => (
            <div key={jar.id} style={{ borderTop: '1px solid var(--border)' }}>
              {/* Jar header row */}
              <div style={{
                padding: '12px 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'var(--surface-2)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 16 }}>{jar.emoji}</span>
                  <p style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-1)' }}>{jar.name}</p>
                  <span style={{ fontSize: 11, color: 'var(--text-3)' }}>Meta: {formatCurrency(jar.monthlyContribution)}/mês</span>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                  {tracked.length === 0 ? (
                    <span style={{ fontSize: 11, color: 'var(--text-3)' }}>Sem dados de aportes ainda</span>
                  ) : (
                    <>
                      {totalDeficit > 0 && (
                        <span className="pill pill-red" style={{ fontSize: 10.5 }}>
                          Déficit acumulado: −{formatCurrency(totalDeficit)}
                        </span>
                      )}
                      {totalSurplus > 0 && (
                        <span className="pill pill-green" style={{ fontSize: 10.5 }}>
                          Superávit: +{formatCurrency(totalSurplus)}
                        </span>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Monthly cells */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${HISTORY_MONTHS}, 1fr)`,
                gap: 0,
              }}>
                {months.map((m) => {
                  const pct = m.planned > 0 ? Math.min(100, (m.actual / m.planned) * 100) : 0;
                  const isDeficit = m.hasData && m.delta < 0;
                  const isSurplus = m.hasData && m.delta > 0;

                  return (
                    <div
                      key={m.ym}
                      style={{
                        padding: '12px 16px',
                        borderRight: '1px solid var(--border)',
                        background: !m.hasData
                          ? 'transparent'
                          : isDeficit
                          ? '#fff7f7'
                          : '#f0fdf4',
                      }}
                    >
                      <p style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                        {m.label}
                      </p>

                      {!m.hasData ? (
                        <p style={{ fontSize: 11, color: 'var(--text-3)' }}>—</p>
                      ) : (
                        <>
                          <p style={{ fontFamily: 'Fraunces, serif', fontSize: 13, fontWeight: 400, color: isDeficit ? 'var(--red)' : 'var(--green)', marginBottom: 2 }}>
                            {formatCurrency(m.actual)}
                          </p>
                          <p style={{ fontSize: 10, color: 'var(--text-3)', marginBottom: 6 }}>
                            {isDeficit
                              ? `−${formatCurrency(-m.delta)}`
                              : isSurplus
                              ? `+${formatCurrency(m.delta)}`
                              : '✓ Meta'}
                          </p>
                          {/* Progress bar */}
                          <div style={{ height: 3, borderRadius: 99, background: 'var(--border)', overflow: 'hidden' }}>
                            <div style={{
                              height: '100%',
                              borderRadius: 99,
                              width: `${pct}%`,
                              background: isDeficit ? 'var(--red)' : 'var(--green)',
                            }} />
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          <div style={{ padding: '12px 24px', borderTop: '1px solid var(--border)' }}>
            <p style={{ fontSize: 11, color: 'var(--text-3)', lineHeight: 1.6 }}>
              A projeção acima já considera o saldo atual de cada cofrinho. Meses com déficit reduzem a
              base de partida, meses com superávit compensam automaticamente.
            </p>
          </div>
        </div>
      )}

      {/* Cash flow projection */}
      {(monthlyIncome > 0 || monthlyFixed > 0) && (
        <div className="surface" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px 0' }}>
            <p className="section-title">Projeção de Caixa</p>
            <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 3, marginBottom: 16 }}>
              Baseado em salários, gastos fixos e aportes mensais
            </p>
          </div>

          {/* Summary strip */}
          <div style={{ display: 'flex', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
            {[
              { label: 'Entradas Mensais', value: formatCurrency(monthlyIncome), color: 'var(--green)', sub: 'Salários' },
              { label: 'Saídas Mensais', value: formatCurrency(monthlyFixed + monthlyJarContribs), color: 'var(--red)', sub: `Fixos + Aportes` },
              { label: 'Fluxo Líquido/mês', value: formatCurrency(monthlyCashFlow), color: monthlyCashFlow >= 0 ? 'var(--accent)' : 'var(--red)', sub: monthlyCashFlow >= 0 ? 'Sobra livre' : 'Déficit' },
              { label: `Saldo em ${horizon} meses`, value: formatCurrency(cashFlowData[cashFlowData.length - 1]?.Saldo ?? 0), color: 'var(--accent)', sub: 'Acumulado livre' },
            ].map((s, i) => (
              <div key={i} className="stat-chip" style={{ flex: 1 }}>
                <p className="eyebrow" style={{ marginBottom: 5 }}>{s.label}</p>
                <p style={{ fontFamily: 'Fraunces, serif', fontSize: '1.3rem', fontWeight: 300, color: s.color, letterSpacing: '-0.02em', lineHeight: 1 }}>
                  {s.value}
                </p>
                <p style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 3 }}>{s.sub}</p>
              </div>
            ))}
          </div>

          {/* Breakdown */}
          <div style={{ padding: '16px 24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-2)', marginBottom: 8 }}>Composição das entradas</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                  <span style={{ color: 'var(--text-2)' }}>Salário Leo</span>
                  <span style={{ fontFamily: 'Fraunces, serif', color: 'var(--green)' }}>{formatCurrency(getSalaryForMonth(salaryHistory.Leonardo, currentMonth))}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                  <span style={{ color: 'var(--text-2)' }}>Salário Serena</span>
                  <span style={{ fontFamily: 'Fraunces, serif', color: 'var(--green)' }}>{formatCurrency(getSalaryForMonth(salaryHistory.Serena, currentMonth))}</span>
                </div>
              </div>
            </div>
            <div>
              <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-2)', marginBottom: 8 }}>Composição das saídas</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                  <span style={{ color: 'var(--text-2)' }}>Gastos fixos</span>
                  <span style={{ fontFamily: 'Fraunces, serif', color: 'var(--red)' }}>{formatCurrency(monthlyFixed)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                  <span style={{ color: 'var(--text-2)' }}>Aportes cofrinhos</span>
                  <span style={{ fontFamily: 'Fraunces, serif', color: 'var(--text-2)' }}>{formatCurrency(monthlyJarContribs)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Jars without yield — informational */}
      {jarsNoYield.length > 0 && jarsWithYield.length > 0 && (
        <div className="surface" style={{ padding: '16px 24px' }}>
          <p style={{ fontSize: 12, color: 'var(--text-3)' }}>
            <strong style={{ color: 'var(--text-2)' }}>{jarsNoYield.map(j => j.name).join(', ')}</strong>
            {' '}não têm rendimento cadastrado — projeção linear (só aportes).
            Edite o cofrinho para adicionar uma taxa.
          </p>
        </div>
      )}

      {/* Empty state */}
      {savingsJars.length === 0 && (
        <div className="surface" style={{ padding: '60px 24px', textAlign: 'center' }}>
          <p style={{ fontSize: 32, marginBottom: 12 }}>🐷</p>
          <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-1)', marginBottom: 8 }}>
            Nenhum cofrinho cadastrado
          </p>
          <p style={{ fontSize: 13, color: 'var(--text-3)' }}>
            Crie cofrinhos com aporte mensal e rendimento para ver as projeções aqui.
          </p>
        </div>
      )}
    </div>
  );
}
