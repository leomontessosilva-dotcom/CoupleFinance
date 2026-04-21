import { useMemo } from 'react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { TrendingUp, DollarSign, Wallet, ArrowUpRight, ArrowDownRight, Clock } from 'lucide-react';
import { useStore } from '../store/useStore';
import { formatCurrency, formatShortDate, isInMonth, categoryColors, formatMonthShort, prevMonth } from '../utils/format';

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

export default function Dashboard() {
  const { transactions, fixedExpenses, investments, savingsJars, currentMonth } = useStore();

  const monthData = useMemo(() => {
    const monthTx = transactions.filter((t) => isInMonth(t.date, currentMonth));
    const income = monthTx.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expenses = monthTx.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const fixedTotal = fixedExpenses.filter((f) => f.active).reduce((s, f) => s + f.amount, 0);
    const balance = income - expenses;
    const savingsRate = income > 0 ? ((balance / income) * 100) : 0;
    const totalInvested = investments.reduce((s, i) => s + i.currentValue, 0);
    const totalJars = savingsJars.reduce((s, j) => s + j.currentValue, 0);
    const netWorth = totalInvested + totalJars + balance;

    // Health score
    let score = 50;
    if (savingsRate >= 20) score += 20;
    else if (savingsRate >= 10) score += 10;
    if (fixedTotal < income * 0.5) score += 15;
    if (totalInvested > income * 3) score += 15;

    return { income, expenses, fixedTotal, balance, savingsRate, totalInvested, totalJars, netWorth, score: Math.min(100, score) };
  }, [transactions, fixedExpenses, investments, savingsJars, currentMonth]);

  // Chart data: last 6 months
  const chartData = useMemo(() => {
    const months: string[] = [];
    let m = currentMonth;
    for (let i = 5; i >= 0; i--) {
      let cur = m;
      for (let j = 0; j < i; j++) cur = prevMonth(cur);
      months.push(cur);
    }
    return months.map((mon) => {
      const tx = transactions.filter((t) => isInMonth(t.date, mon));
      const income = tx.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
      const expenses = tx.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
      return { name: formatMonthShort(mon), Receitas: income, Despesas: expenses, Saldo: income - expenses };
    });
  }, [transactions, currentMonth]);

  const recentTx = useMemo(() =>
    transactions.filter((t) => isInMonth(t.date, currentMonth)).slice(0, 6),
    [transactions, currentMonth]
  );

  const upcomingBills = useMemo(() => {
    const today = new Date();
    return fixedExpenses
      .filter((f) => f.active && f.dueDay >= today.getDate())
      .sort((a, b) => a.dueDay - b.dueDay)
      .slice(0, 5);
  }, [fixedExpenses]);

  const topJars = savingsJars.slice(0, 3);

  const scoreColor = monthData.score >= 75 ? '#10b981' : monthData.score >= 50 ? '#f59e0b' : '#ef4444';
  const scoreLabel = monthData.score >= 75 ? 'Excelente' : monthData.score >= 50 ? 'Bom' : 'Atenção';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Hero row */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Net Worth - big card */}
        <div className="lg:col-span-2 relative rounded-2xl overflow-hidden bg-gradient-to-br from-purple-700 via-purple-600 to-pink-500 p-6 shadow-purple">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-white/20 -translate-y-12 translate-x-12" />
            <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-white/10 translate-y-8 -translate-x-8" />
          </div>
          <div className="relative">
            <p className="text-purple-200 text-xs font-semibold uppercase tracking-wider mb-1">Patrimônio Líquido</p>
            <p className="font-display text-3xl font-semibold text-white mb-0.5">{formatCurrency(monthData.netWorth)}</p>
            <p className="text-purple-200 text-xs">Investimentos + Cofrinhos + Saldo</p>
            <div className="mt-4 flex items-center gap-4 pt-4 border-t border-white/20">
              <div>
                <p className="text-purple-200 text-[10px] uppercase tracking-wider">Investido</p>
                <p className="text-white font-semibold text-sm">{formatCurrency(monthData.totalInvested)}</p>
              </div>
              <div className="w-px h-8 bg-white/20" />
              <div>
                <p className="text-purple-200 text-[10px] uppercase tracking-wider">Cofrinhos</p>
                <p className="text-white font-semibold text-sm">{formatCurrency(monthData.totalJars)}</p>
              </div>
              <div className="w-px h-8 bg-white/20" />
              <div>
                <p className="text-purple-200 text-[10px] uppercase tracking-wider">Saldo Mês</p>
                <p className={`font-semibold text-sm ${monthData.balance >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                  {formatCurrency(monthData.balance)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats grid */}
        <div className="stat-card flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <p className="label mb-1">Receitas do Mês</p>
              <p className="font-display text-2xl font-semibold text-gray-800">{formatCurrency(monthData.income)}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
              <ArrowUpRight size={20} className="text-green-500" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5">
            <TrendingUp size={12} className="text-green-500" />
            <span className="text-xs text-green-600 font-medium">Leonardo + Serena</span>
          </div>
        </div>

        <div className="stat-card flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <p className="label mb-1">Despesas do Mês</p>
              <p className="font-display text-2xl font-semibold text-gray-800">{formatCurrency(monthData.expenses)}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
              <ArrowDownRight size={20} className="text-red-400" />
            </div>
          </div>
          <div className="mt-3">
            <div className="progress-bar">
              <div
                className="progress-fill bg-gradient-to-r from-pink-400 to-pink-600"
                style={{ width: `${Math.min(100, (monthData.expenses / monthData.income) * 100)}%` }}
              />
            </div>
            <p className="text-[10px] text-gray-400 mt-1">{((monthData.expenses / monthData.income) * 100).toFixed(0)}% da receita</p>
          </div>
        </div>
      </div>

      {/* Second row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="stat-card flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0">
            <Wallet size={22} className="text-purple-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="label mb-0.5">Taxa de Poupança</p>
            <p className="font-display text-xl font-semibold text-gray-800">{monthData.savingsRate.toFixed(1)}%</p>
            <div className="progress-bar mt-1.5">
              <div className="progress-fill bg-gradient-to-r from-purple-500 to-purple-700"
                style={{ width: `${Math.min(100, monthData.savingsRate)}%` }} />
            </div>
          </div>
        </div>

        <div className="stat-card flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-pink-50 flex items-center justify-center flex-shrink-0">
            <DollarSign size={22} className="text-pink-500" />
          </div>
          <div>
            <p className="label mb-0.5">Gastos Fixos</p>
            <p className="font-display text-xl font-semibold text-gray-800">{formatCurrency(monthData.fixedTotal)}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {((monthData.fixedTotal / monthData.income) * 100).toFixed(0)}% da renda
            </p>
          </div>
        </div>

        {/* Health Score */}
        <div className="stat-card flex items-center gap-4">
          <div className="relative w-14 h-14 flex-shrink-0">
            <svg viewBox="0 0 56 56" className="w-full h-full -rotate-90">
              <circle cx="28" cy="28" r="23" fill="none" stroke="#f3f4f6" strokeWidth="5" />
              <circle
                cx="28" cy="28" r="23" fill="none"
                stroke={scoreColor} strokeWidth="5"
                strokeDasharray={`${(monthData.score / 100) * 144.5} 144.5`}
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-gray-800">
              {monthData.score}
            </span>
          </div>
          <div>
            <p className="label mb-0.5">Saúde Financeira</p>
            <p className="font-semibold text-gray-800" style={{ color: scoreColor }}>{scoreLabel}</p>
            <p className="text-xs text-gray-400 mt-0.5">Score de {monthData.score}/100</p>
          </div>
        </div>
      </div>

      {/* Chart + Side panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <div className="lg:col-span-2 card p-6">
          <div className="section-header mb-4">
            <h3 className="font-semibold text-gray-800">Receitas vs Despesas</h3>
            <span className="text-xs text-gray-400">Últimos 6 meses</span>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={chartData} barGap={4} barSize={20}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false}
                tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="Receitas" fill="#7c3aed" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Despesas" fill="#f472b6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Upcoming bills */}
        <div className="card p-5">
          <div className="section-header mb-4">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <Clock size={15} className="text-purple-500" /> Próximas Contas
            </h3>
          </div>
          <div className="space-y-2.5">
            {upcomingBills.map((bill) => (
              <div key={bill.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-xs font-bold text-purple-600">
                    {bill.dueDay}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-700">{bill.name}</p>
                    <p className="text-[10px] text-gray-400">{bill.person}</p>
                  </div>
                </div>
                <span className="text-xs font-semibold text-gray-800">{formatCurrency(bill.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom row: Transactions + Cofrinhos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent transactions */}
        <div className="card p-5">
          <div className="section-header mb-4">
            <h3 className="font-semibold text-gray-800">Transações Recentes</h3>
          </div>
          <div className="space-y-1">
            {recentTx.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between p-2.5 rounded-xl hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                    style={{ backgroundColor: categoryColors[tx.category] || '#9ca3af' }}
                  >
                    {tx.category.charAt(0)}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-700">{tx.description}</p>
                    <p className="text-[10px] text-gray-400">{formatShortDate(tx.date)} · {tx.person}</p>
                  </div>
                </div>
                <span className={`text-sm font-semibold ${tx.type === 'income' ? 'text-green-600' : 'text-red-500'}`}>
                  {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Cofrinhos preview */}
        <div className="card p-5">
          <div className="section-header mb-4">
            <h3 className="font-semibold text-gray-800">Cofrinhos</h3>
            <span className="text-xs text-gray-400">Top metas</span>
          </div>
          <div className="space-y-4">
            {topJars.map((jar) => {
              const pct = Math.min(100, (jar.currentValue / jar.targetValue) * 100);
              return (
                <div key={jar.id}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{jar.emoji}</span>
                      <span className="text-sm font-semibold text-gray-700">{jar.name}</span>
                    </div>
                    <span className="text-xs font-bold" style={{ color: jar.color }}>{pct.toFixed(0)}%</span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-fill transition-all duration-700"
                      style={{ width: `${pct}%`, backgroundColor: jar.color }}
                    />
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-[10px] text-gray-400">{formatCurrency(jar.currentValue)}</span>
                    <span className="text-[10px] text-gray-400">{formatCurrency(jar.targetValue)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Savings trend chart */}
      <div className="card p-6">
        <div className="section-header mb-4">
          <h3 className="font-semibold text-gray-800">Evolução do Saldo</h3>
          <span className="text-xs text-gray-400">Saldo mensal acumulado</span>
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="balanceGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false}
              tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="Saldo" stroke="#7c3aed" strokeWidth={2.5}
              fill="url(#balanceGrad)" dot={{ fill: '#7c3aed', r: 3 }} activeDot={{ r: 5 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
