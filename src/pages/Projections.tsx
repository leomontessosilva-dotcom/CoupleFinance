import { useState, useMemo } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import { useStore } from '../store/useStore';
import { formatCurrency } from '../utils/format';
import type { SavingsJar } from '../types';

/* ── Helpers ──────────────────────────────────────────────── */

/** Normalize any yield rate to a monthly decimal rate */
function toMonthlyRate(rate: number, period: string): number {
  const r = rate / 100;
  if (period === 'diário')  return Math.pow(1 + r, 30) - 1;
  if (period === 'anual')   return Math.pow(1 + r, 1 / 12) - 1;
  return r; // mensal
}

/** Future value of a jar after `months` months with compound interest */
function jarFutureValue(jar: SavingsJar, months: number): number {
  if (!jar.yieldRate || jar.yieldRate <= 0) {
    // No yield: simple linear growth
    return jar.currentValue + jar.monthlyContribution * months;
  }
  const r = toMonthlyRate(jar.yieldRate, jar.yieldPeriod ?? 'mensal');
  const pv = jar.currentValue;
  const pmt = jar.monthlyContribution;
  // FV = PV*(1+r)^n + PMT*((1+r)^n - 1)/r
  const growth = Math.pow(1 + r, months);
  return pv * growth + (r > 0 ? pmt * (growth - 1) / r : pmt * months);
}

/** Interest earned = FV - PV - total contributions */
function jarInterestEarned(jar: SavingsJar, months: number): number {
  const fv = jarFutureValue(jar, months);
  return fv - jar.currentValue - jar.monthlyContribution * months;
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
  const { savingsJars } = useStore();
  const [horizon, setHorizon] = useState<6 | 12 | 24 | 36>(12);

  const jarsWithYield = savingsJars.filter((j) => j.yieldRate && j.yieldRate > 0);
  const jarsNoYield   = savingsJars.filter((j) => !j.yieldRate || j.yieldRate === 0);

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

  const totalFV       = summary.reduce((s, r) => s + r.fv, 0);
  const totalInterest = summary.reduce((s, r) => s + r.interest, 0);
  const totalContrib  = summary.reduce((s, r) => s + r.totalContrib, 0);

  const COLORS = ['#6D28D9', '#D5197A', '#047857', '#B45309', '#1D4ED8', '#DC2626', '#8B5CF6', '#10B981'];

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
                  <th>Aporte Mensal</th>
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
                        <span className="pill pill-green" style={{ fontSize: 11 }}>
                          {monthlyRate.toFixed(3)}%/mês
                        </span>
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
