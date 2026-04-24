import { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Trash2, Search, Download, ArrowUpRight, ArrowDownRight, Pencil } from 'lucide-react';
import { useStore } from '../store/useStore';
import { formatCurrency, formatDate, isInMonth, categoryColors, generateId, addMonthsToDate } from '../utils/format';
import type { Transaction, TransactionType, TransactionCategory, Person, PaymentMethod } from '../types';

const INCOME_CATEGORIES: TransactionCategory[] = ['Salário', 'Freelance', 'Investimentos', 'Outros Ganhos'];
const EXPENSE_CATEGORIES: TransactionCategory[] = ['Moradia', 'Transporte', 'Alimentação', 'Saúde', 'Educação', 'Lazer', 'Assinaturas', 'Roupas', 'Viagem', 'Aporte', 'Outros'];
const ALL_CATEGORIES = [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES];

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'credito', label: 'Cartão de Crédito' },
  { value: 'debito', label: 'Cartão de Débito' },
  { value: 'pix', label: 'Pix' },
  { value: 'dinheiro', label: 'Dinheiro' },
  { value: 'outro', label: 'Outro' },
];

const PAYMENT_LABELS: Record<string, string> = {
  credito: 'Crédito', debito: 'Débito', pix: 'Pix', dinheiro: 'Dinheiro', outro: 'Outro',
};

// Form carries an extra UI-only `installments` field to control how the
// purchase is split when paymentMethod === 'credito'. It's never persisted
// directly; instead it drives how many child transactions we create on save.
type TransactionForm = Partial<Transaction> & { installments?: number };

const emptyForm = (): TransactionForm => ({
  type: 'expense',
  category: 'Alimentação',
  description: '',
  amount: 0,
  date: new Date().toISOString().split('T')[0],
  person: 'Casal',
  paymentMethod: undefined,
  creditCardId: undefined,
  installments: 1,
});

export default function Transactions() {
  const { transactions, addTransaction, updateTransaction, deleteTransaction, currentMonth, fixedExpenses, creditCards } = useStore();
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [search, setSearch] = useState('');
  const [filterPerson, setFilterPerson] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterPayment, setFilterPayment] = useState<string>('all');

  const monthTx = useMemo(() => {
    return transactions.filter((t) => isInMonth(t.date, currentMonth));
  }, [transactions, currentMonth]);

  const filtered = useMemo(() => {
    return monthTx.filter((t) => {
      if (filterPerson !== 'all' && t.person !== filterPerson) return false;
      if (filterType !== 'all' && t.type !== filterType) return false;
      if (filterCategory !== 'all' && t.category !== filterCategory) return false;
      if (filterPayment !== 'all' && t.paymentMethod !== filterPayment) return false;
      if (search && !t.description.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    }).sort((a, b) => b.date.localeCompare(a.date));
  }, [monthTx, filterPerson, filterType, filterCategory, filterPayment, search]);

  // Receitas = transações de entrada do mês (salário agora é uma transação auto-gerada)
  const salaryIncome = monthTx.filter((t) => t.type === 'income' && t.category === 'Salário').reduce((s, t) => s + t.amount, 0);
  const totalIncome = monthTx.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);

  // Despesas = gastos fixos + transações de saída do mês (incluindo aportes,
  // pois saem do saldo; no card são somados junto mas mostrados com breakdown)
  const fixedTotal = fixedExpenses.filter((f) => f.active).reduce((s, f) => s + f.amount, 0);
  const aportesTotal = monthTx.filter((t) => t.type === 'expense' && t.category === 'Aporte').reduce((s, t) => s + t.amount, 0);
  const spendingTotal = monthTx.filter((t) => t.type === 'expense' && t.category !== 'Aporte').reduce((s, t) => s + t.amount, 0);
  const totalExpenses = fixedTotal + spendingTotal + aportesTotal;

  const handleSave = () => {
    if (!form.description || !form.amount) return;

    const isCredit     = form.paymentMethod === 'credito';
    const installments = isCredit ? Math.max(1, Math.min(60, Number(form.installments) || 1)) : 1;
    const isSplit      = installments > 1 && !editingId;

    // Editing an existing transaction: single update, no installment expansion
    if (editingId) {
      const t: Transaction = {
        id: editingId,
        type: form.type as TransactionType,
        category: form.category as TransactionCategory,
        description: form.description!,
        amount: Number(form.amount),
        date: form.date!,
        person: form.person as Person,
        paymentMethod: form.paymentMethod as PaymentMethod | undefined,
        creditCardId: isCredit ? form.creditCardId : undefined,
        savingsJarId: form.savingsJarId,
        purchaseId: form.purchaseId,
        installmentNumber: form.installmentNumber,
        installmentsTotal: form.installmentsTotal,
      };
      updateTransaction(t);
    } else if (isSplit) {
      // New purchase split into N installments — each is its own Transaction
      const purchaseId = generateId();
      const per = Math.round((Number(form.amount) / installments) * 100) / 100;
      // Distribute rounding residue onto installment 1 so the sum matches exactly
      const residue = Math.round((Number(form.amount) - per * installments) * 100) / 100;
      for (let i = 1; i <= installments; i++) {
        const t: Transaction = {
          id: generateId(),
          type: form.type as TransactionType,
          category: form.category as TransactionCategory,
          description: `${form.description} (${i}/${installments})`,
          amount: i === 1 ? per + residue : per,
          date: addMonthsToDate(form.date!, i - 1),
          person: form.person as Person,
          paymentMethod: 'credito',
          creditCardId: form.creditCardId,
          savingsJarId: form.savingsJarId,
          purchaseId,
          installmentNumber: i,
          installmentsTotal: installments,
        };
        addTransaction(t);
      }
    } else {
      // New, single transaction (cash/PIX/debit, or 1x credit)
      const t: Transaction = {
        id: generateId(),
        type: form.type as TransactionType,
        category: form.category as TransactionCategory,
        description: form.description!,
        amount: Number(form.amount),
        date: form.date!,
        person: form.person as Person,
        paymentMethod: form.paymentMethod as PaymentMethod | undefined,
        creditCardId: isCredit ? form.creditCardId : undefined,
        savingsJarId: form.savingsJarId,
      };
      addTransaction(t);
    }
    setShowModal(false);
    setEditingId(null);
    setForm(emptyForm());
  };

  const openEdit = (t: Transaction) => {
    setEditingId(t.id);
    setForm({
      type: t.type, category: t.category, description: t.description,
      amount: t.amount, date: t.date, person: t.person,
      paymentMethod: t.paymentMethod, creditCardId: t.creditCardId,
      savingsJarId: t.savingsJarId,
      purchaseId: t.purchaseId,
      installmentNumber: t.installmentNumber,
      installmentsTotal: t.installmentsTotal,
      installments: 1, // edit is per-installment, not per-purchase
    });
    setShowModal(true);
  };

  const openNew = () => {
    setEditingId(null);
    setForm(emptyForm());
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
  };

  const handleDelete = (t: Transaction) => {
    // If this is part of an installment purchase, ask whether to delete just
    // this one or the whole purchase (all remaining installments).
    if (t.purchaseId && t.installmentsTotal && t.installmentsTotal > 1) {
      const all = transactions.filter((x) => x.purchaseId === t.purchaseId);
      const remaining = all.length;
      const msg = `Esta é a parcela ${t.installmentNumber}/${t.installmentsTotal}. A compra toda tem ${remaining} parcela(s) registrada(s).\n\nOK = excluir esta parcela apenas.\nCancelar = excluir a compra inteira (todas as parcelas).`;
      if (window.confirm(msg)) {
        deleteTransaction(t.id);
      } else {
        all.forEach((x) => deleteTransaction(x.id));
      }
    } else {
      deleteTransaction(t.id);
    }
  };

  const exportCSV = () => {
    const rows = [['Data', 'Descrição', 'Categoria', 'Tipo', 'Valor', 'Pessoa', 'Forma'],
      ...filtered.map((t) => [t.date, t.description, t.category, t.type, t.amount, t.person, t.paymentMethod || ''])];
    const csv = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `transacoes-${currentMonth}.csv`; a.click();
  };

  const balance = totalIncome - totalExpenses;

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Summary cards */}
      <div className="tx-summary-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        <div className="stat-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <ArrowUpRight size={16} color="#16a34a" />
            </div>
            <div style={{ minWidth: 0 }}>
              <p className="label" style={{ marginBottom: 2 }}>Entradas</p>
              <p style={{ fontFamily: 'Fraunces, serif', fontSize: '1.2rem', fontWeight: 400, color: '#16a34a', letterSpacing: '-0.02em', lineHeight: 1 }}>
                {formatCurrency(totalIncome)}
              </p>
              {salaryIncome > 0 && (
                <p style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 2 }}>
                  Salário: {formatCurrency(salaryIncome)}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <ArrowDownRight size={16} color="#dc2626" />
            </div>
            <div style={{ minWidth: 0 }}>
              <p className="label" style={{ marginBottom: 2 }}>Saídas</p>
              <p style={{ fontFamily: 'Fraunces, serif', fontSize: '1.2rem', fontWeight: 400, color: '#dc2626', letterSpacing: '-0.02em', lineHeight: 1 }}>
                {formatCurrency(totalExpenses)}
              </p>
              {(fixedTotal > 0 || aportesTotal > 0) && (
                <p style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 2 }}>
                  {fixedTotal > 0 && `Fixos ${formatCurrency(fixedTotal)}`}
                  {fixedTotal > 0 && aportesTotal > 0 && ' · '}
                  {aportesTotal > 0 && `Aportes ${formatCurrency(aportesTotal)}`}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: balance >= 0 ? '#EDE9FE' : '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: balance >= 0 ? 'var(--accent)' : '#dc2626' }}>≡</span>
            </div>
            <div style={{ minWidth: 0 }}>
              <p className="label" style={{ marginBottom: 2 }}>Saldo</p>
              <p style={{ fontFamily: 'Fraunces, serif', fontSize: '1.2rem', fontWeight: 400, color: balance >= 0 ? 'var(--accent)' : '#dc2626', letterSpacing: '-0.02em', lineHeight: 1 }}>
                {formatCurrency(balance)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters row */}
      <div className="surface" style={{ padding: '14px 16px' }}>
        {/* Top row: search + add */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', pointerEvents: 'none' }} />
            <input type="text" placeholder="Buscar transação..." className="input-field"
              style={{ paddingLeft: '2.2rem' }} value={search}
              onChange={(e) => setSearch(e.target.value)} />
          </div>
          <button onClick={exportCSV} className="btn-outline hide-on-mobile" style={{ display: 'flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap' }}>
            <Download size={13} /> Exportar
          </button>
          <button onClick={openNew} className="gradient-btn" style={{ whiteSpace: 'nowrap' }}>
            <Plus size={15} /> Adicionar
          </button>
        </div>

        {/* Bottom row: filters */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <select className="select-field" style={{ width: 'auto', minWidth: 110, flex: '1 1 110px' }} value={filterType} onChange={(e) => setFilterType(e.target.value)}>
            <option value="all">Todos tipos</option>
            <option value="income">Entradas</option>
            <option value="expense">Saídas</option>
          </select>

          <select className="select-field" style={{ width: 'auto', minWidth: 110, flex: '1 1 110px' }} value={filterPerson} onChange={(e) => setFilterPerson(e.target.value)}>
            <option value="all">Todos</option>
            <option value="Leonardo">Leonardo</option>
            <option value="Serena">Serena</option>
            <option value="Casal">Casal</option>
          </select>

          <select className="select-field" style={{ width: 'auto', minWidth: 130, flex: '1 1 130px' }} value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
            <option value="all">Todas categorias</option>
            {ALL_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>

          <select className="select-field" style={{ width: 'auto', minWidth: 130, flex: '1 1 130px' }} value={filterPayment} onChange={(e) => setFilterPayment(e.target.value)}>
            <option value="all">Todas formas</option>
            {PAYMENT_METHODS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
        </div>
      </div>

      {/* Transaction list */}
      <div className="surface" style={{ overflow: 'hidden' }}>

        {filtered.length === 0 && (
          <p style={{ textAlign: 'center', padding: '48px 16px', color: 'var(--text-3)', fontSize: 13 }}>
            Nenhuma transação encontrada
          </p>
        )}

        {/* ── Desktop table ── */}
        <div className="hide-on-mobile" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 560 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface-2)' }}>
                <th style={{ textAlign: 'left', padding: '10px 16px', fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-3)', whiteSpace: 'nowrap' }}>Descrição</th>
                <th style={{ textAlign: 'left', padding: '10px 12px', fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-3)', whiteSpace: 'nowrap' }}>Categoria</th>
                <th style={{ textAlign: 'left', padding: '10px 12px', fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-3)', whiteSpace: 'nowrap' }}>Data</th>
                <th style={{ textAlign: 'left', padding: '10px 12px', fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-3)', whiteSpace: 'nowrap' }}>Pessoa</th>
                <th style={{ textAlign: 'left', padding: '10px 12px', fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-3)', whiteSpace: 'nowrap' }}>Forma</th>
                <th style={{ textAlign: 'right', padding: '10px 16px', fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-3)', whiteSpace: 'nowrap' }}>Valor</th>
                <th style={{ width: 36 }} />
              </tr>
            </thead>
            <tbody>
              {filtered.map((tx) => (
                <tr key={tx.id} style={{ borderBottom: '1px solid var(--border)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(0,0,0,0.012)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ padding: '11px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: `${categoryColors[tx.category] || '#9ca3af'}18` }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: categoryColors[tx.category] || '#9ca3af' }}>
                          {tx.category.charAt(0)}
                        </span>
                      </div>
                      <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 180 }}>
                        {tx.description}
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: '11px 12px' }}>
                    <span className="pill" style={{ background: `${categoryColors[tx.category] || '#9ca3af'}15`, color: categoryColors[tx.category] || '#9ca3af', fontSize: 10.5 }}>
                      {tx.category}
                    </span>
                  </td>
                  <td style={{ padding: '11px 12px', fontSize: 12, color: 'var(--text-2)', whiteSpace: 'nowrap' }}>{formatDate(tx.date)}</td>
                  <td style={{ padding: '11px 12px' }}>
                    <span className={`pill ${tx.person === 'Leonardo' ? 'pill-purple' : tx.person === 'Serena' ? 'pill-pink' : 'pill-gray'}`} style={{ fontSize: 10.5 }}>
                      {tx.person}
                    </span>
                  </td>
                  <td style={{ padding: '11px 12px' }}>
                    {tx.paymentMethod ? (
                      <div>
                        <span className={`pill ${tx.paymentMethod === 'credito' ? 'pill-purple' : tx.paymentMethod === 'pix' ? 'pill-green' : 'pill-gray'}`} style={{ fontSize: 10.5 }}>
                          {PAYMENT_LABELS[tx.paymentMethod]}
                        </span>
                        {tx.paymentMethod === 'credito' && tx.creditCardId && creditCards.find(c => c.id === tx.creditCardId) && (
                          <p style={{ fontSize: 9.5, color: 'var(--text-3)', marginTop: 2 }}>
                            {creditCards.find(c => c.id === tx.creditCardId)!.name}
                          </p>
                        )}
                      </div>
                    ) : (
                      <span style={{ fontSize: 11, color: 'var(--border-strong)' }}>—</span>
                    )}
                  </td>
                  <td style={{ padding: '11px 16px', textAlign: 'right' }}>
                    <span style={{ fontFamily: 'Fraunces, serif', fontSize: 13, fontWeight: 400, letterSpacing: '-0.01em', color: tx.type === 'income' ? 'var(--green)' : 'var(--red)' }}>
                      {tx.type === 'income' ? '+' : '−'}{formatCurrency(tx.amount)}
                    </span>
                  </td>
                  <td style={{ padding: '11px 8px' }}>
                    <div style={{ display: 'flex', gap: 2 }}>
                      <button onClick={() => openEdit(tx)}
                        style={{ width: 26, height: 26, borderRadius: 6, border: 'none', cursor: 'pointer', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)' }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(0,0,0,0.04)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                        title="Editar"
                      >
                        <Pencil size={12} />
                      </button>
                      <button onClick={() => handleDelete(tx)}
                        style={{ width: 26, height: 26, borderRadius: 6, border: 'none', cursor: 'pointer', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f87171' }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = '#FEE2E2')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                        title="Excluir"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── Mobile card list ── */}
        <div className="show-on-mobile">
          {filtered.map((tx) => (
            <div key={tx.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${categoryColors[tx.category] || '#9ca3af'}15` }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: categoryColors[tx.category] || '#9ca3af' }}>
                  {tx.category.charAt(0)}
                </span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {tx.description}
                </p>
                <p style={{ fontSize: 10.5, color: 'var(--text-3)', marginTop: 2 }}>
                  {formatDate(tx.date)} · {tx.category}
                  {tx.person !== 'Casal' && ` · ${tx.person === 'Leonardo' ? 'Leo' : 'Serena'}`}
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                <span style={{ fontFamily: 'Fraunces, serif', fontSize: 14, fontWeight: 400, letterSpacing: '-0.01em', color: tx.type === 'income' ? 'var(--green)' : 'var(--red)' }}>
                  {tx.type === 'income' ? '+' : '−'}{formatCurrency(tx.amount)}
                </span>
                <button onClick={() => openEdit(tx)}
                  style={{ width: 28, height: 28, borderRadius: 7, border: 'none', cursor: 'pointer', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Pencil size={12} color="var(--text-3)" />
                </button>
                <button onClick={() => handleDelete(tx)}
                  style={{ width: 28, height: 28, borderRadius: 7, border: 'none', cursor: 'pointer', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Trash2 size={13} color="#f87171" />
                </button>
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* Add/Edit modal — portal so position:fixed is relative to viewport, not page */}
      {showModal && createPortal(
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.25rem', fontWeight: 300, color: 'var(--text-1)', letterSpacing: '-0.02em', marginBottom: 20 }}>
              {editingId ? 'Editar Transação' : 'Nova Transação'}
            </h3>

            {/* Type toggle */}
            <div style={{ display: 'flex', gap: 4, marginBottom: 20, padding: 4, background: 'var(--surface-2)', borderRadius: 10, border: '1px solid var(--border)' }}>
              <button
                style={{ flex: 1, padding: '8px 0', borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, transition: 'all 120ms', background: form.type === 'expense' ? 'white' : 'transparent', color: form.type === 'expense' ? '#dc2626' : 'var(--text-3)', boxShadow: form.type === 'expense' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none' }}
                onClick={() => setForm({ ...form, type: 'expense', category: 'Alimentação' })}
              >
                Despesa
              </button>
              <button
                style={{ flex: 1, padding: '8px 0', borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, transition: 'all 120ms', background: form.type === 'income' ? 'white' : 'transparent', color: form.type === 'income' ? 'var(--green)' : 'var(--text-3)', boxShadow: form.type === 'income' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none' }}
                onClick={() => setForm({ ...form, type: 'income', category: 'Salário' })}
              >
                Receita
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label className="f-label">Descrição</label>
                <input className="input" placeholder="Ex: Supermercado Extra" value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label className="f-label">Valor (R$)</label>
                  <input type="number" className="input" placeholder="0,00" value={form.amount || ''}
                    onChange={(e) => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })} />
                </div>
                <div>
                  <label className="f-label">Data</label>
                  <input type="date" className="input" value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label className="f-label">Categoria</label>
                  <select className="input" value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value as TransactionCategory })}>
                    {(form.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="f-label">Pessoa</label>
                  <select className="input" value={form.person}
                    onChange={(e) => setForm({ ...form, person: e.target.value as Person })}>
                    <option>Leonardo</option>
                    <option>Serena</option>
                    <option>Casal</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="f-label">Forma de pagamento</label>
                <select className="input" value={form.paymentMethod ?? ''}
                  onChange={(e) => setForm({ ...form, paymentMethod: (e.target.value as PaymentMethod) || undefined, creditCardId: undefined })}>
                  <option value="">Não informado</option>
                  {PAYMENT_METHODS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </div>

              {/* Credit card selector — only when paymentMethod === 'credito' */}
              {form.paymentMethod === 'credito' && creditCards.length > 0 && (
                <div>
                  <label className="f-label">Cartão de crédito</label>
                  <select className="input" value={form.creditCardId ?? ''}
                    onChange={(e) => setForm({ ...form, creditCardId: e.target.value || undefined })}>
                    <option value="">Selecionar cartão (opcional)</option>
                    {creditCards.map((c) => (
                      <option key={c.id} value={c.id}>{c.name} — {c.person}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Installments — only for NEW credit-card purchases.
                  When editing an existing installment, this is hidden
                  because edits are per-installment, not per-purchase. */}
              {form.paymentMethod === 'credito' && !editingId && (
                <div>
                  <label className="f-label">Parcelas</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input type="number" min={1} max={60} className="input" style={{ width: 80 }}
                      value={form.installments ?? 1}
                      onChange={(e) => setForm({ ...form, installments: Math.max(1, Math.min(60, parseInt(e.target.value) || 1)) })} />
                    <span style={{ fontSize: 12, color: 'var(--text-3)' }}>
                      {(form.installments ?? 1) > 1
                        ? `${(form.installments ?? 1)}× de ${formatCurrency((Number(form.amount) || 0) / (form.installments ?? 1))}`
                        : 'À vista (1x)'}
                    </span>
                  </div>
                </div>
              )}

              {/* Info banner when editing a specific installment */}
              {editingId && form.installmentsTotal && form.installmentsTotal > 1 && (
                <div style={{ padding: '10px 12px', background: 'var(--surface-2)', borderRadius: 8, fontSize: 12, color: 'var(--text-2)' }}>
                  Editando parcela <strong>{form.installmentNumber}/{form.installmentsTotal}</strong>. Mudanças afetam só esta parcela.
                </div>
              )}

              <div style={{ display: 'flex', gap: 8, paddingTop: 4 }}>
                <button className="btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={handleSave}>
                  {editingId ? 'Atualizar' : 'Salvar'}
                </button>
                <button className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={closeModal}>
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
