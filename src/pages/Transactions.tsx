import { useState, useMemo } from 'react';
import { Plus, Trash2, Search, Download, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useStore } from '../store/useStore';
import { formatCurrency, formatDate, isInMonth, categoryColors, generateId } from '../utils/format';
import type { Transaction, TransactionType, TransactionCategory, Person } from '../types';

const INCOME_CATEGORIES: TransactionCategory[] = ['Salário', 'Freelance', 'Investimentos', 'Outros Ganhos'];
const EXPENSE_CATEGORIES: TransactionCategory[] = ['Moradia', 'Transporte', 'Alimentação', 'Saúde', 'Educação', 'Lazer', 'Assinaturas', 'Roupas', 'Viagem', 'Outros'];
const ALL_CATEGORIES = [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES];

const emptyForm = (): Partial<Transaction> => ({
  type: 'expense',
  category: 'Alimentação',
  description: '',
  amount: 0,
  date: new Date().toISOString().split('T')[0],
  person: 'Casal',
});

export default function Transactions() {
  const { transactions, addTransaction, deleteTransaction, currentMonth } = useStore();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [search, setSearch] = useState('');
  const [filterPerson, setFilterPerson] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const monthTx = useMemo(() => {
    return transactions.filter((t) => isInMonth(t.date, currentMonth));
  }, [transactions, currentMonth]);

  const filtered = useMemo(() => {
    return monthTx.filter((t) => {
      if (filterPerson !== 'all' && t.person !== filterPerson) return false;
      if (filterType !== 'all' && t.type !== filterType) return false;
      if (filterCategory !== 'all' && t.category !== filterCategory) return false;
      if (search && !t.description.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    }).sort((a, b) => b.date.localeCompare(a.date));
  }, [monthTx, filterPerson, filterType, filterCategory, search]);

  const totalIncome = monthTx.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpenses = monthTx.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  const handleAdd = () => {
    if (!form.description || !form.amount) return;
    const t: Transaction = {
      id: generateId(),
      type: form.type as TransactionType,
      category: form.category as TransactionCategory,
      description: form.description!,
      amount: Number(form.amount),
      date: form.date!,
      person: form.person as Person,
    };
    addTransaction(t);
    setShowModal(false);
    setForm(emptyForm());
  };

  const exportCSV = () => {
    const rows = [['Data', 'Descrição', 'Categoria', 'Tipo', 'Valor', 'Pessoa'],
      ...filtered.map((t) => [t.date, t.description, t.category, t.type, t.amount, t.person])];
    const csv = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `transacoes-${currentMonth}.csv`; a.click();
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="stat-card flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
            <ArrowUpRight size={18} className="text-green-500" />
          </div>
          <div>
            <p className="label">Entradas</p>
            <p className="font-display text-xl font-semibold text-green-600">{formatCurrency(totalIncome)}</p>
          </div>
        </div>
        <div className="stat-card flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
            <ArrowDownRight size={18} className="text-red-400" />
          </div>
          <div>
            <p className="label">Saídas</p>
            <p className="font-display text-xl font-semibold text-red-500">{formatCurrency(totalExpenses)}</p>
          </div>
        </div>
        <div className="stat-card flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${totalIncome - totalExpenses >= 0 ? 'bg-purple-50' : 'bg-red-50'}`}>
            <span className={`text-lg font-bold ${totalIncome - totalExpenses >= 0 ? 'text-purple-600' : 'text-red-500'}`}>≡</span>
          </div>
          <div>
            <p className="label">Saldo</p>
            <p className={`font-display text-xl font-semibold ${totalIncome - totalExpenses >= 0 ? 'text-purple-700' : 'text-red-500'}`}>
              {formatCurrency(totalIncome - totalExpenses)}
            </p>
          </div>
        </div>
      </div>

      {/* Filters row */}
      <div className="card p-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-48">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar transação..."
              className="input-field pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select className="select-field w-36" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
            <option value="all">Todos tipos</option>
            <option value="income">Entradas</option>
            <option value="expense">Saídas</option>
          </select>

          <select className="select-field w-40" value={filterPerson} onChange={(e) => setFilterPerson(e.target.value)}>
            <option value="all">Todos</option>
            <option value="Leonardo">Leonardo</option>
            <option value="Serena">Serena</option>
            <option value="Casal">Casal</option>
          </select>

          <select className="select-field w-44" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
            <option value="all">Todas categorias</option>
            {ALL_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>

          <button onClick={exportCSV} className="btn-outline flex items-center gap-1.5">
            <Download size={14} /> Exportar
          </button>

          <button onClick={() => { setForm(emptyForm()); setShowModal(true); }} className="gradient-btn flex items-center gap-1.5">
            <Plus size={16} /> Adicionar
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-50">
              <th className="text-left p-4 label">Descrição</th>
              <th className="text-left p-4 label">Categoria</th>
              <th className="text-left p-4 label">Data</th>
              <th className="text-left p-4 label">Pessoa</th>
              <th className="text-right p-4 label">Valor</th>
              <th className="p-4 w-10" />
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-12 text-gray-400 text-sm">
                  Nenhuma transação encontrada
                </td>
              </tr>
            )}
            {filtered.map((tx) => (
              <tr key={tx.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                      style={{ backgroundColor: categoryColors[tx.category] || '#9ca3af' }}>
                      {tx.category.charAt(0)}
                    </div>
                    <span className="text-sm font-semibold text-gray-700">{tx.description}</span>
                  </div>
                </td>
                <td className="p-4">
                  <span className="badge" style={{ backgroundColor: `${categoryColors[tx.category]}18`, color: categoryColors[tx.category] }}>
                    {tx.category}
                  </span>
                </td>
                <td className="p-4 text-sm text-gray-500">{formatDate(tx.date)}</td>
                <td className="p-4">
                  <span className={`badge ${tx.person === 'Leonardo' ? 'bg-purple-50 text-purple-600' : tx.person === 'Serena' ? 'bg-pink-50 text-pink-600' : 'bg-gray-50 text-gray-600'}`}>
                    {tx.person}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <span className={`font-semibold text-sm ${tx.type === 'income' ? 'text-green-600' : 'text-red-500'}`}>
                    {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                  </span>
                </td>
                <td className="p-4">
                  <button onClick={() => deleteTransaction(tx.id)} className="w-7 h-7 rounded-lg hover:bg-red-50 flex items-center justify-center transition-colors">
                    <Trash2 size={13} className="text-red-400" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display text-xl font-semibold text-gray-800 mb-5">Nova Transação</h3>

            {/* Type toggle */}
            <div className="flex gap-2 mb-5 p-1 bg-gray-100 rounded-xl">
              <button
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${form.type === 'expense' ? 'bg-white shadow-sm text-red-500' : 'text-gray-500'}`}
                onClick={() => setForm({ ...form, type: 'expense', category: 'Alimentação' })}
              >
                Despesa
              </button>
              <button
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${form.type === 'income' ? 'bg-white shadow-sm text-green-600' : 'text-gray-500'}`}
                onClick={() => setForm({ ...form, type: 'income', category: 'Salário' })}
              >
                Receita
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="form-label">Descrição</label>
                <input className="input-field" placeholder="Ex: Supermercado Extra" value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">Valor (R$)</label>
                  <input type="number" className="input-field" placeholder="0,00" value={form.amount || ''}
                    onChange={(e) => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })} />
                </div>
                <div>
                  <label className="form-label">Data</label>
                  <input type="date" className="input-field" value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">Categoria</label>
                  <select className="select-field" value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value as TransactionCategory })}>
                    {(form.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
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
              </div>
              <div className="flex gap-3 pt-2">
                <button className="gradient-btn flex-1" onClick={handleAdd}>Salvar</button>
                <button className="btn-outline flex-1" onClick={() => setShowModal(false)}>Cancelar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
