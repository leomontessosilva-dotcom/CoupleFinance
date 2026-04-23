import { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useStore } from '../store/useStore';
import { formatCurrency, generateId } from '../utils/format';
import type { FixedExpense, FixedExpenseCategory, Person } from '../types';

const CATEGORIES: FixedExpenseCategory[] = ['Moradia', 'Transporte', 'Alimentação', 'Saúde', 'Educação', 'Lazer', 'Assinaturas', 'Serviços', 'Outros'];

const emptyForm = (): Partial<FixedExpense> => ({
  name: '', amount: 0, dueDay: 5, category: 'Moradia', person: 'Casal', active: true,
});

const catColors: Record<string, string> = {
  Moradia: '#3b82f6', Transporte: '#f59e0b', Alimentação: '#ec4899', Saúde: '#14b8a6',
  Educação: '#8b5cf6', Lazer: '#f472b6', Assinaturas: '#6366f1', Serviços: '#64748b', Outros: '#9ca3af',
};

export default function FixedExpenses() {
  const { fixedExpenses, addFixedExpense, deleteFixedExpense, toggleFixedExpense } = useStore();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [filterPerson, setFilterPerson] = useState<string>('all');

  const active = fixedExpenses.filter((f) => f.active);
  const filtered = fixedExpenses
    .filter((f) => filterPerson === 'all' || f.person === filterPerson)
    .sort((a, b) => a.dueDay - b.dueDay);

  const totalActive = active.reduce((s, f) => s + f.amount, 0);
  const leoTotal = active.filter((f) => f.person === 'Leonardo' || f.person === 'Casal').reduce((s, f) => s + f.amount, 0);
  const serenaTotal = active.filter((f) => f.person === 'Serena' || f.person === 'Casal').reduce((s, f) => s + f.amount, 0);

  const pieData = useMemo(() => {
    const byCategory: Record<string, number> = {};
    active.forEach((f) => { byCategory[f.category] = (byCategory[f.category] || 0) + f.amount; });
    return Object.entries(byCategory).map(([name, value]) => ({ name, value }));
  }, [active]);

  const handleAdd = () => {
    if (!form.name || !form.amount) return;
    const f: FixedExpense = {
      id: generateId(),
      name: form.name!,
      amount: Number(form.amount),
      dueDay: Number(form.dueDay) || 5,
      category: form.category as FixedExpenseCategory,
      person: form.person as Person,
      active: true,
    };
    addFixedExpense(f);
    setShowModal(false);
    setForm(emptyForm());
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="stat-card">
          <p className="label mb-1">Total Mensal</p>
          <p className="font-display text-2xl font-semibold gradient-text">{formatCurrency(totalActive)}</p>
          <p className="text-xs text-gray-400 mt-1">{active.length} contas ativas</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 text-white text-[9px] font-bold flex items-center justify-center">L</div>
            <p className="label">Leonardo</p>
          </div>
          <p className="font-display text-2xl font-semibold text-purple-700">{formatCurrency(leoTotal)}</p>
          <p className="text-xs text-gray-400 mt-1">Pessoal + Casal</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-pink-400 to-pink-600 text-white text-[9px] font-bold flex items-center justify-center">S</div>
            <p className="label">Serena</p>
          </div>
          <p className="font-display text-2xl font-semibold text-pink-500">{formatCurrency(serenaTotal)}</p>
          <p className="text-xs text-gray-400 mt-1">Pessoal + Casal</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Pie chart */}
        <div className="card p-5">
          <h3 className="font-semibold text-gray-800 mb-3">Por Categoria</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                paddingAngle={3} dataKey="value">
                {pieData.map((entry, i) => (
                  <Cell key={i} fill={catColors[entry.name] || '#9ca3af'} />
                ))}
              </Pie>
              <Tooltip formatter={(v: any) => formatCurrency(Number(v))} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 10 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* List */}
        <div className="lg:col-span-2 card overflow-hidden">
          <div className="p-5 border-b border-gray-50 flex items-center justify-between">
            <h3 className="font-semibold text-gray-800">Todas as Contas</h3>
            <div className="flex items-center gap-2">
              <select className="select-field w-36 text-xs" value={filterPerson} onChange={(e) => setFilterPerson(e.target.value)}>
                <option value="all">Todos</option>
                <option value="Leonardo">Leonardo</option>
                <option value="Serena">Serena</option>
                <option value="Casal">Casal</option>
              </select>
              <button onClick={() => { setForm(emptyForm()); setShowModal(true); }} className="gradient-btn-sm flex items-center gap-1">
                <Plus size={13} /> Adicionar
              </button>
            </div>
          </div>

          <div className="divide-y divide-gray-50">
            {filtered.map((f) => (
              <div key={f.id} className={`flex items-center justify-between px-5 py-3.5 hover:bg-gray-50/50 transition-colors ${!f.active ? 'opacity-50' : ''}`}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold"
                    style={{ backgroundColor: catColors[f.category] || '#9ca3af' }}>
                    {f.dueDay}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-700">{f.name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[10px] text-gray-400">{f.category}</span>
                      <span className="text-gray-200">·</span>
                      <span className={`text-[10px] font-medium ${
                        f.person === 'Leonardo' ? 'text-purple-500' :
                        f.person === 'Serena' ? 'text-pink-500' : 'text-gray-500'}`}>
                        {f.person}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-sm text-gray-800">{formatCurrency(f.amount)}</span>
                  <button onClick={() => toggleFixedExpense(f.id)} className="text-gray-400 hover:text-purple-600 transition-colors">
                    {f.active ? <ToggleRight size={22} className="text-purple-500" /> : <ToggleLeft size={22} />}
                  </button>
                  <button onClick={() => deleteFixedExpense(f.id)} className="w-7 h-7 rounded-lg hover:bg-red-50 flex items-center justify-center transition-colors">
                    <Trash2 size={13} className="text-red-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && createPortal(
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display text-xl font-semibold text-gray-800 mb-5">Novo Gasto Fixo</h3>
            <div className="space-y-4">
              <div>
                <label className="form-label">Nome da conta</label>
                <input className="input-field" placeholder="Ex: Aluguel" value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">Valor (R$)</label>
                  <input type="number" className="input-field" placeholder="0,00" value={form.amount || ''}
                    onChange={(e) => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })} />
                </div>
                <div>
                  <label className="form-label">Dia do vencimento</label>
                  <input type="number" min={1} max={31} className="input-field" value={form.dueDay}
                    onChange={(e) => setForm({ ...form, dueDay: parseInt(e.target.value) })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">Categoria</label>
                  <select className="select-field" value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value as FixedExpenseCategory })}>
                    {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Responsável</label>
                  <select className="select-field" value={form.person}
                    onChange={(e) => setForm({ ...form, person: e.target.value as Person })}>
                    <option>Casal</option>
                    <option>Leonardo</option>
                    <option>Serena</option>
                  </select>
                </div>
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
