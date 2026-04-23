import { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Trash2, TrendingUp, TrendingDown } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { useStore } from '../store/useStore';
import { formatCurrency, formatDate, generateId, investmentColors } from '../utils/format';
import type { Investment, InvestmentType, Person } from '../types';

const TYPES: InvestmentType[] = ['CDB', 'LCI', 'LCA', 'Ações', 'FII', 'Crypto', 'Poupança', 'Tesouro', 'Outros'];

const emptyForm = (): Partial<Investment> => ({
  name: '', type: 'CDB', institution: '', initialValue: 0, currentValue: 0,
  date: new Date().toISOString().split('T')[0], person: 'Leonardo', monthlyContribution: 0,
});

export default function Investments() {
  const { investments, addInvestment, deleteInvestment } = useStore();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm());

  const totalInvested = investments.reduce((s, i) => s + i.initialValue, 0);
  const totalCurrent = investments.reduce((s, i) => s + i.currentValue, 0);
  const totalReturn = totalCurrent - totalInvested;
  const returnPct = totalInvested > 0 ? ((totalReturn / totalInvested) * 100) : 0;
  const monthlyContribs = investments.reduce((s, i) => s + (i.monthlyContribution || 0), 0);

  const pieData = useMemo(() => {
    const byType: Record<string, number> = {};
    investments.forEach((i) => { byType[i.type] = (byType[i.type] || 0) + i.currentValue; });
    return Object.entries(byType).map(([name, value]) => ({ name, value }));
  }, [investments]);

  const barData = useMemo(() => {
    const byPerson: Record<string, { invested: number; current: number }> = {};
    investments.forEach((i) => {
      if (!byPerson[i.person]) byPerson[i.person] = { invested: 0, current: 0 };
      byPerson[i.person].invested += i.initialValue;
      byPerson[i.person].current += i.currentValue;
    });
    return Object.entries(byPerson).map(([name, v]) => ({ name, Investido: v.invested, Atual: v.current }));
  }, [investments]);

  const handleAdd = () => {
    if (!form.name || !form.currentValue) return;
    const inv: Investment = {
      id: generateId(),
      name: form.name!,
      type: form.type as InvestmentType,
      institution: form.institution!,
      initialValue: Number(form.initialValue),
      currentValue: Number(form.currentValue),
      date: form.date!,
      person: form.person as Person,
      monthlyContribution: Number(form.monthlyContribution) || undefined,
    };
    addInvestment(inv);
    setShowModal(false);
    setForm(emptyForm());
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="stat-card">
          <p className="label mb-1">Total Investido</p>
          <p className="font-display text-xl font-semibold text-gray-800">{formatCurrency(totalInvested)}</p>
        </div>
        <div className="stat-card">
          <p className="label mb-1">Valor Atual</p>
          <p className="font-display text-xl font-semibold gradient-text">{formatCurrency(totalCurrent)}</p>
        </div>
        <div className="stat-card">
          <p className="label mb-1">Rendimento Total</p>
          <div className="flex items-center gap-1.5">
            {totalReturn >= 0 ? <TrendingUp size={16} className="text-green-500" /> : <TrendingDown size={16} className="text-red-400" />}
            <p className={`font-display text-xl font-semibold ${totalReturn >= 0 ? 'text-green-600' : 'text-red-500'}`}>
              {formatCurrency(totalReturn)}
            </p>
          </div>
          <p className={`text-xs mt-0.5 font-medium ${returnPct >= 0 ? 'text-green-500' : 'text-red-400'}`}>
            {returnPct >= 0 ? '+' : ''}{returnPct.toFixed(2)}%
          </p>
        </div>
        <div className="stat-card">
          <p className="label mb-1">Aportes Mensais</p>
          <p className="font-display text-xl font-semibold text-purple-700">{formatCurrency(monthlyContribs)}</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <h3 className="font-semibold text-gray-800 mb-4">Alocação por Tipo</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={90}
                paddingAngle={3} dataKey="value">
                {pieData.map((entry, i) => (
                  <Cell key={i} fill={investmentColors[entry.name] || '#9ca3af'} />
                ))}
              </Pie>
              <Tooltip formatter={(v: any) => formatCurrency(Number(v))} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 10 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <h3 className="font-semibold text-gray-800 mb-4">Por Pessoa</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={barData} barSize={28} barGap={6}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false}
                tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: any) => formatCurrency(Number(v))} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="Investido" fill="#e9d5ff" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Atual" fill="#7c3aed" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="p-5 border-b border-gray-50 flex items-center justify-between">
          <h3 className="font-semibold text-gray-800">Carteira</h3>
          <button onClick={() => { setForm(emptyForm()); setShowModal(true); }} className="gradient-btn flex items-center gap-1.5">
            <Plus size={16} /> Adicionar
          </button>
        </div>
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <table className="w-full" style={{ minWidth: 600 }}>
          <thead>
            <tr className="border-b border-gray-50">
              <th className="text-left p-4 label">Ativo</th>
              <th className="text-left p-4 label">Tipo</th>
              <th className="text-left p-4 label">Instituição</th>
              <th className="text-left p-4 label">Pessoa</th>
              <th className="text-right p-4 label">Investido</th>
              <th className="text-right p-4 label">Atual</th>
              <th className="text-right p-4 label">Rendimento</th>
              <th className="p-4 w-10" />
            </tr>
          </thead>
          <tbody>
            {investments.map((inv) => {
              const ret = inv.currentValue - inv.initialValue;
              const retPct = inv.initialValue > 0 ? ((ret / inv.initialValue) * 100) : 0;
              return (
                <tr key={inv.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="p-4">
                    <p className="text-sm font-semibold text-gray-800">{inv.name}</p>
                    <p className="text-[10px] text-gray-400">{formatDate(inv.date)}</p>
                  </td>
                  <td className="p-4">
                    <span className="badge" style={{ backgroundColor: `${investmentColors[inv.type]}18`, color: investmentColors[inv.type] }}>
                      {inv.type}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-gray-500">{inv.institution}</td>
                  <td className="p-4">
                    <span className={`badge ${inv.person === 'Leonardo' ? 'bg-purple-50 text-purple-600' : inv.person === 'Serena' ? 'bg-pink-50 text-pink-600' : 'bg-gray-50 text-gray-600'}`}>
                      {inv.person}
                    </span>
                  </td>
                  <td className="p-4 text-right text-sm text-gray-600">{formatCurrency(inv.initialValue)}</td>
                  <td className="p-4 text-right text-sm font-semibold text-gray-800">{formatCurrency(inv.currentValue)}</td>
                  <td className="p-4 text-right">
                    <p className={`text-sm font-semibold ${ret >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {ret >= 0 ? '+' : ''}{formatCurrency(ret)}
                    </p>
                    <p className={`text-[10px] ${ret >= 0 ? 'text-green-500' : 'text-red-400'}`}>
                      {retPct >= 0 ? '+' : ''}{retPct.toFixed(2)}%
                    </p>
                  </td>
                  <td className="p-4">
                    <button onClick={() => deleteInvestment(inv.id)} className="w-7 h-7 rounded-lg hover:bg-red-50 flex items-center justify-center transition-colors">
                      <Trash2 size={13} className="text-red-400" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && createPortal(
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display text-xl font-semibold text-gray-800 mb-5">Novo Investimento</h3>
            <div className="space-y-4">
              <div>
                <label className="form-label">Nome</label>
                <input className="input-field" placeholder="Ex: CDB Nubank" value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">Tipo</label>
                  <select className="select-field" value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value as InvestmentType })}>
                    {TYPES.map((t) => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Instituição</label>
                  <input className="input-field" placeholder="Ex: Nubank" value={form.institution}
                    onChange={(e) => setForm({ ...form, institution: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">Valor Inicial (R$)</label>
                  <input type="number" className="input-field" value={form.initialValue || ''}
                    onChange={(e) => setForm({ ...form, initialValue: parseFloat(e.target.value) || 0 })} />
                </div>
                <div>
                  <label className="form-label">Valor Atual (R$)</label>
                  <input type="number" className="input-field" value={form.currentValue || ''}
                    onChange={(e) => setForm({ ...form, currentValue: parseFloat(e.target.value) || 0 })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">Data Inicial</label>
                  <input type="date" className="input-field" value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })} />
                </div>
                <div>
                  <label className="form-label">Aporte Mensal (R$)</label>
                  <input type="number" className="input-field" value={form.monthlyContribution || ''}
                    onChange={(e) => setForm({ ...form, monthlyContribution: parseFloat(e.target.value) || 0 })} />
                </div>
              </div>
              <div>
                <label className="form-label">Pessoa</label>
                <select className="select-field" value={form.person}
                  onChange={(e) => setForm({ ...form, person: e.target.value as Person })}>
                  <option>Leonardo</option>
                  <option>Serena</option>
                  <option>Casal</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button className="gradient-btn flex-1" onClick={handleAdd}>Salvar</button>
                <button className="btn-outline flex-1" onClick={() => setShowModal(false)}>Cancelar</button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
