import { useState, useMemo } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts';
import { useStore } from '../store/useStore';
import { formatCurrency, isInMonth, prevMonth } from '../utils/format';

type Horizon = 6 | 12 | 24;
type Scenario = 'pessimistic' | 'realistic' | 'optimistic';

const scenarioMultipliers: Record<Scenario, { income: number; expense: number }> = {
  pessimistic: { income: 0.95, expense: 1.1 },
  realistic: { income: 1.0, expense: 1.0 },
  optimistic: { income: 1.1, expense: 0.9 },
};

const scenarioLabels: Record<Scenario, string> = {
  pessimistic: 'Pessimista',
  realistic: 'Realista',
  optimistic: 'Otimista',
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white rounded-xl shadow-card border border-gray-100 p-3 text-xs">
        <p className="font-semibold text-gray-700 mb-1">{label}</p>
        {payload.map((p: any) => (
          <p key={p.name} style={{ color: p.color }} className="font-medium">
            {p.name}: {formatCurrency(p.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function Projections() {
  const { transactions, fixedExpenses, investments, currentMonth } = useStore();
  const [horizon, setHorizon] = useState<Horizon>(12);
  const [scenario, setScenario] = useState<Scenario>('realistic');
  const [goalAmount, setGoalAmount] = useState('');
  const [monthlyRate, setMonthlyRate] = useState('0.8');

  // Calculate base monthly metrics from last 3 months
  const baseMetrics = useMemo(() => {
    let totalIncome = 0; let totalExpenses = 0; let months = 0;
    let m = currentMonth;
    for (let i = 0; i < 3; i++) {
      const tx = transactions.filter((t) => isInMonth(t.date, m));
      const inc = tx.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
      const exp = tx.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
      if (inc > 0) { totalIncome += inc; totalExpenses += exp; months++; }
      m = prevMonth(m);
    }
    const fixedTotal = fixedExpenses.filter((f) => f.active).reduce((s, f) => s + f.amount, 0);
    const avgIncome = months > 0 ? totalIncome / months : 14700;
    const avgExpenses = months > 0 ? totalExpenses / months : 8000;
    const totalInvested = investments.reduce((s, i) => s + i.currentValue, 0);
    const monthlyContribs = investments.reduce((s, i) => s + (i.monthlyContribution || 0), 0);
    return { avgIncome, avgExpenses, fixedTotal, totalInvested, monthlyContribs };
  }, [transactions, fixedExpenses, investments, currentMonth]);

  // Projection data
  const projectionData = useMemo(() => {
    const mult = scenarioMultipliers[scenario];
    const income = baseMetrics.avgIncome * mult.income;
    const expenses = baseMetrics.avgExpenses * mult.expense;
    const monthlySavings = income - expenses;
    const rate = parseFloat(monthlyRate) / 100;

    const data: any[] = [];
    let cumulativeSavings = 0;
    let investmentValue = baseMetrics.totalInvested;

    for (let i = 1; i <= horizon; i++) {
      const d = new Date();
      d.setMonth(d.getMonth() + i);
      const label = d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });

      cumulativeSavings += monthlySavings;
      investmentValue = (investmentValue + baseMetrics.monthlyContribs) * (1 + rate);

      data.push({
        month: label,
        Receitas: Math.round(income),
        Despesas: Math.round(expenses),
        Saldo: Math.round(monthlySavings),
        'Poupança Acum.': Math.round(cumulativeSavings),
        'Investimentos': Math.round(investmentValue),
        Patrimônio: Math.round(cumulativeSavings + investmentValue),
      });
    }
    return data;
  }, [baseMetrics, scenario, horizon, monthlyRate]);

  // "When will we reach X?" calculator
  const goalMonths = useMemo(() => {
    if (!goalAmount) return null;
    const goal = parseFloat(goalAmount);
    if (!goal || goal <= 0) return null;
    const mult = scenarioMultipliers[scenario];
    const income = baseMetrics.avgIncome * mult.income;
    const expenses = baseMetrics.avgExpenses * mult.expense;
    const monthlySavings = income - expenses;
    const rate = parseFloat(monthlyRate) / 100;

    if (monthlySavings <= 0) return Infinity;

    let acc = 0; let inv = baseMetrics.totalInvested;
    for (let i = 1; i <= 360; i++) {
      acc += monthlySavings;
      inv = (inv + baseMetrics.monthlyContribs) * (1 + rate);
      if (acc + inv >= goal) return i;
    }
    return null;
  }, [goalAmount, baseMetrics, scenario, monthlyRate]);

  const finalPatrimony = projectionData[projectionData.length - 1]?.Patrimônio || 0;
  const finalInvested = projectionData[projectionData.length - 1]?.Investimentos || 0;
  const totalSaved = projectionData[projectionData.length - 1]?.['Poupança Acum.'] || 0;
  const mult = scenarioMultipliers[scenario];
  const projectedSavings = (baseMetrics.avgIncome * mult.income) - (baseMetrics.avgExpenses * mult.expense);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Controls */}
      <div className="card p-5">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <p className="form-label mb-2">Horizonte</p>
            <div className="flex gap-1.5">
              {([6, 12, 24] as Horizon[]).map((h) => (
                <button key={h} onClick={() => setHorizon(h)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${horizon === h ? 'bg-gradient-to-r from-purple-700 to-purple-500 text-white shadow-purple' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                  {h} meses
                </button>
              ))}
            </div>
          </div>

          <div className="w-px h-10 bg-gray-100 hidden md:block" />

          <div>
            <p className="form-label mb-2">Cenário</p>
            <div className="flex gap-1.5">
              {(['pessimistic', 'realistic', 'optimistic'] as Scenario[]).map((s) => (
                <button key={s} onClick={() => setScenario(s)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${scenario === s
                    ? s === 'optimistic' ? 'bg-green-500 text-white' : s === 'pessimistic' ? 'bg-red-400 text-white' : 'bg-gradient-to-r from-purple-700 to-purple-500 text-white shadow-purple'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                  {scenarioLabels[s]}
                </button>
              ))}
            </div>
          </div>

          <div className="w-px h-10 bg-gray-100 hidden md:block" />

          <div>
            <p className="form-label mb-2">Rentabilidade/mês (%)</p>
            <input type="number" step="0.1" className="input-field w-32" value={monthlyRate}
              onChange={(e) => setMonthlyRate(e.target.value)} />
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="stat-card">
          <p className="label mb-1">Poupança Mensal Est.</p>
          <p className={`font-display text-xl font-semibold ${projectedSavings >= 0 ? 'text-green-600' : 'text-red-500'}`}>
            {formatCurrency(projectedSavings)}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">Cenário {scenarioLabels[scenario].toLowerCase()}</p>
        </div>
        <div className="stat-card">
          <p className="label mb-1">Poupança em {horizon}m</p>
          <p className="font-display text-xl font-semibold text-gray-800">{formatCurrency(totalSaved)}</p>
        </div>
        <div className="stat-card">
          <p className="label mb-1">Investimentos em {horizon}m</p>
          <p className="font-display text-xl font-semibold gradient-text">{formatCurrency(finalInvested)}</p>
        </div>
        <div className="stat-card">
          <p className="label mb-1">Patrimônio em {horizon}m</p>
          <p className="font-display text-xl font-semibold text-purple-700">{formatCurrency(finalPatrimony)}</p>
        </div>
      </div>

      {/* Main projection chart */}
      <div className="card p-6">
        <h3 className="font-semibold text-gray-800 mb-4">Evolução do Patrimônio — {scenarioLabels[scenario]}</h3>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={projectionData}>
            <defs>
              <linearGradient id="patrimonioGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="investGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ec4899" stopOpacity={0.1} />
                <stop offset="95%" stopColor="#ec4899" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false}
              tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
            <Tooltip content={<CustomTooltip />} />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
            <Area type="monotone" dataKey="Patrimônio" stroke="#7c3aed" strokeWidth={2.5}
              fill="url(#patrimonioGrad)" dot={false} />
            <Area type="monotone" dataKey="Investimentos" stroke="#ec4899" strokeWidth={2}
              fill="url(#investGrad)" dot={false} />
            <Area type="monotone" dataKey="Poupança Acum." stroke="#10b981" strokeWidth={2}
              fill="none" dot={false} strokeDasharray="5 3" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Income vs Expenses projection */}
      <div className="card p-6">
        <h3 className="font-semibold text-gray-800 mb-4">Fluxo de Caixa Projetado</h3>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={projectionData}>
            <defs>
              <linearGradient id="recGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="despGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f472b6" stopOpacity={0.1} />
                <stop offset="95%" stopColor="#f472b6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false}
              tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
            <Tooltip content={<CustomTooltip />} />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
            <Area type="monotone" dataKey="Receitas" stroke="#10b981" strokeWidth={2} fill="url(#recGrad)" dot={false} />
            <Area type="monotone" dataKey="Despesas" stroke="#f472b6" strokeWidth={2} fill="url(#despGrad)" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Goal calculator */}
      <div className="card p-6">
        <h3 className="font-semibold text-gray-800 mb-1">Calculadora de Metas</h3>
        <p className="text-sm text-gray-400 mb-5">Quando vamos atingir um valor específico?</p>

        <div className="flex items-end gap-4">
          <div className="flex-1 max-w-xs">
            <label className="form-label">Meta (R$)</label>
            <input type="number" className="input-field" placeholder="Ex: 100000" value={goalAmount}
              onChange={(e) => setGoalAmount(e.target.value)} />
          </div>
          {goalAmount && (
            <div className="card p-4 flex-1">
              {goalMonths === null ? (
                <p className="text-sm text-gray-500">Insira um valor válido</p>
              ) : goalMonths === Infinity ? (
                <p className="text-sm text-red-500">Poupança negativa no cenário atual</p>
              ) : (
                <>
                  <p className="label mb-1">Tempo estimado</p>
                  <p className="font-display text-2xl font-semibold gradient-text">
                    {goalMonths < 12
                      ? `${goalMonths} ${goalMonths === 1 ? 'mês' : 'meses'}`
                      : `${Math.floor(goalMonths / 12)} ano${Math.floor(goalMonths / 12) > 1 ? 's' : ''} e ${goalMonths % 12} meses`}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Cenário {scenarioLabels[scenario].toLowerCase()} · Meta: {formatCurrency(parseFloat(goalAmount))}
                  </p>
                </>
              )}
            </div>
          )}
        </div>

        {/* Scenario comparison table */}
        <div className="mt-6">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Comparação de Cenários</h4>
          <div className="overflow-hidden rounded-xl border border-gray-100">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left p-3 label">Cenário</th>
                  <th className="text-right p-3 label">Receita Est.</th>
                  <th className="text-right p-3 label">Despesa Est.</th>
                  <th className="text-right p-3 label">Poupança/mês</th>
                  <th className="text-right p-3 label">Patrimônio {horizon}m</th>
                </tr>
              </thead>
              <tbody>
                {(['pessimistic', 'realistic', 'optimistic'] as Scenario[]).map((s) => {
                  const m = scenarioMultipliers[s];
                  const inc = baseMetrics.avgIncome * m.income;
                  const exp = baseMetrics.avgExpenses * m.expense;
                  const sav = inc - exp;
                  const rate = parseFloat(monthlyRate) / 100;
                  let inv = baseMetrics.totalInvested;
                  let cumSav = 0;
                  for (let i = 0; i < horizon; i++) {
                    cumSav += sav;
                    inv = (inv + baseMetrics.monthlyContribs) * (1 + rate);
                  }
                  return (
                    <tr key={s} className={`border-t border-gray-50 ${scenario === s ? 'bg-purple-50/50' : ''}`}>
                      <td className="p-3 font-semibold">
                        <span className={`badge ${s === 'optimistic' ? 'bg-green-50 text-green-600' : s === 'pessimistic' ? 'bg-red-50 text-red-500' : 'bg-purple-50 text-purple-600'}`}>
                          {scenarioLabels[s]}
                        </span>
                      </td>
                      <td className="p-3 text-right text-gray-600">{formatCurrency(inc)}</td>
                      <td className="p-3 text-right text-gray-600">{formatCurrency(exp)}</td>
                      <td className={`p-3 text-right font-semibold ${sav >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                        {formatCurrency(sav)}
                      </td>
                      <td className="p-3 text-right font-semibold text-purple-700">{formatCurrency(cumSav + inv)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
