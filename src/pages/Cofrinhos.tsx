import { useState, useMemo } from 'react';
import { Plus, Trash2, PlusCircle, MinusCircle } from 'lucide-react';
import { useStore } from '../store/useStore';
import { formatCurrency, generateId } from '../utils/format';
import type { SavingsJar, YieldPeriod } from '../types';

const EMOJIS = ['✈️', '🛡️', '🏡', '🚗', '💍', '🎓', '💻', '📱', '🎉', '🌊', '🐾', '🏥', '🎸', '🍕', '🌍'];
const COLORS = ['#7c3aed', '#ec4899', '#10b981', '#f59e0b', '#3b82f6', '#ef4444', '#8b5cf6', '#14b8a6', '#f472b6', '#6366f1'];

const emptyForm = (): Partial<SavingsJar> => ({
  name: '', emoji: '🎯', targetValue: 0, currentValue: 0, color: '#7c3aed',
  monthlyContribution: 0, description: '', yieldRate: undefined, yieldPeriod: 'mensal',
});

function JarCard({ jar }: { jar: SavingsJar }) {
  const { deleteSavingsJar, contributeToJar, transactions, currentMonth } = useStore();
  const [showAdd, setShowAdd] = useState(false);
  const [amount, setAmount] = useState('');
  const [isAdding, setIsAdding] = useState(true);

  const pct = Math.min(100, (jar.currentValue / jar.targetValue) * 100);
  const remaining = jar.targetValue - jar.currentValue;
  const monthsLeft = jar.monthlyContribution > 0 ? Math.ceil(remaining / jar.monthlyContribution) : null;

  const today = new Date();
  let completionDate = '';
  if (monthsLeft !== null) {
    const d = new Date(today.getFullYear(), today.getMonth() + monthsLeft, 1);
    completionDate = d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  }

  // Actual contributions this month from linked transactions
  const actualThisMonth = useMemo(() => {
    return transactions
      .filter((t) => t.savingsJarId === jar.id && t.date.startsWith(currentMonth))
      .reduce((sum, t) => sum + (t.type === 'income' ? t.amount : -t.amount), 0);
  }, [transactions, jar.id, currentMonth]);

  const hasMonthlyGoal = jar.monthlyContribution > 0;
  const hasAnyTracking = transactions.some((t) => t.savingsJarId === jar.id);
  const hasTrackingThisMonth = transactions.some(
    (t) => t.savingsJarId === jar.id && t.date.startsWith(currentMonth)
  );
  const deficit = hasMonthlyGoal ? jar.monthlyContribution - actualThisMonth : 0;

  const handleTransaction = () => {
    const val = parseFloat(amount);
    if (!val || val <= 0) return;
    contributeToJar(jar.id, isAdding ? val : -val);
    setAmount('');
    setShowAdd(false);
  };

  return (
    <div className="card p-5 card-hover relative overflow-hidden">
      {/* Color accent top */}
      <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl" style={{ backgroundColor: jar.color }} />

      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{jar.emoji}</span>
          <div>
            <h3 className="font-semibold text-gray-800">{jar.name}</h3>
            {jar.description && <p className="text-xs text-gray-400 mt-0.5">{jar.description}</p>}
          </div>
        </div>
        <button onClick={() => deleteSavingsJar(jar.id)} className="w-7 h-7 rounded-lg hover:bg-red-50 flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100">
          <Trash2 size={13} className="text-red-400" />
        </button>
      </div>

      {/* Progress */}
      <div className="mb-4">
        <div className="flex justify-between items-end mb-1.5">
          <span className="font-display text-2xl font-semibold text-gray-800">{formatCurrency(jar.currentValue)}</span>
          <span className="text-sm font-semibold" style={{ color: jar.color }}>{pct.toFixed(0)}%</span>
        </div>
        <div className="progress-bar h-3">
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{ width: `${pct}%`, backgroundColor: jar.color }}
          />
        </div>
        <div className="flex justify-between mt-1.5">
          <span className="text-[10px] text-gray-400">Meta: {formatCurrency(jar.targetValue)}</span>
          <span className="text-[10px] text-gray-400">Falta: {formatCurrency(Math.max(0, remaining))}</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="rounded-xl bg-gray-50 p-3">
          <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">Meta Mensal</p>
          <p className="text-sm font-semibold text-gray-700">
            {hasMonthlyGoal ? formatCurrency(jar.monthlyContribution) : '—'}
          </p>
        </div>
        <div className="rounded-xl bg-gray-50 p-3">
          <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">Conclusão Est.</p>
          <p className="text-xs font-semibold text-gray-700 leading-tight">
            {pct >= 100 ? '✅ Alcançado!' : completionDate || 'Sem aporte'}
          </p>
        </div>
        {jar.yieldRate != null && jar.yieldRate > 0 && (
          <div className="col-span-2 rounded-xl p-3" style={{ background: `${jar.color}12`, border: `1px solid ${jar.color}30` }}>
            <p className="text-[10px] uppercase tracking-wide mb-0.5" style={{ color: jar.color }}>Rendimento</p>
            <p className="text-sm font-semibold" style={{ color: jar.color }}>
              {jar.yieldRate}% {jar.yieldPeriod}
            </p>
          </div>
        )}
      </div>

      {/* Monthly compliance panel */}
      {hasMonthlyGoal && (
        <div
          className="rounded-xl p-3 mb-3"
          style={{
            background: !hasAnyTracking
              ? 'var(--surface-2)'
              : !hasTrackingThisMonth
              ? '#fffbeb'
              : deficit > 0
              ? '#fff7f7'
              : deficit < 0
              ? '#f0fdf4'
              : '#f0fdf4',
            border: `1px solid ${
              !hasAnyTracking
                ? 'var(--border)'
                : !hasTrackingThisMonth
                ? '#fde68a'
                : deficit > 0
                ? '#fecaca'
                : '#bbf7d0'
            }`,
          }}
        >
          <p
            className="text-[10px] uppercase tracking-wide font-semibold mb-1.5"
            style={{
              color: !hasAnyTracking || !hasTrackingThisMonth
                ? '#9ca3af'
                : deficit > 0
                ? '#ef4444'
                : '#10b981',
            }}
          >
            Aporte Este Mês
          </p>

          {!hasAnyTracking ? (
            <p className="text-xs text-gray-400 leading-snug">
              Use extratos ou "Depositar" para rastrear aportes.
            </p>
          ) : !hasTrackingThisMonth ? (
            <p className="text-xs text-amber-600 font-medium">
              Nenhum aporte registrado este mês
            </p>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-semibold text-gray-800">
                    {formatCurrency(Math.max(0, actualThisMonth))}
                  </span>
                  <span className="text-xs text-gray-400"> / {formatCurrency(jar.monthlyContribution)}</span>
                </div>
                {deficit > 0 ? (
                  <span className="text-xs font-bold text-red-500">−{formatCurrency(deficit)}</span>
                ) : deficit < 0 ? (
                  <span className="text-xs font-bold text-green-600">+{formatCurrency(-deficit)} extra</span>
                ) : (
                  <span className="text-xs font-bold text-green-600">✓ Meta!</span>
                )}
              </div>
              <div className="mt-2 h-1.5 rounded-full bg-gray-200 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min(100, (actualThisMonth / jar.monthlyContribution) * 100)}%`,
                    backgroundColor: deficit > 0 ? '#ef4444' : '#10b981',
                  }}
                />
              </div>
            </>
          )}
        </div>
      )}

      {/* Actions */}
      {!showAdd ? (
        <div className="flex gap-2">
          <button
            onClick={() => { setIsAdding(true); setShowAdd(true); }}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all"
            style={{ backgroundColor: `${jar.color}18`, color: jar.color }}
          >
            <PlusCircle size={14} /> Depositar
          </button>
          <button
            onClick={() => { setIsAdding(false); setShowAdd(true); }}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-red-50 text-red-500 text-xs font-semibold transition-all hover:bg-red-100"
          >
            <MinusCircle size={14} /> Retirar
          </button>
        </div>
      ) : (
        <div className="flex gap-2">
          <input
            type="number"
            className="input-field flex-1 text-sm"
            placeholder="Valor R$"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && handleTransaction()}
          />
          <button onClick={handleTransaction} className="gradient-btn-sm px-4">
            {isAdding ? '+' : '-'}
          </button>
          <button onClick={() => setShowAdd(false)} className="btn-ghost px-3 py-1.5 text-xs">✕</button>
        </div>
      )}
    </div>
  );
}

export default function Cofrinhos() {
  const { savingsJars, addSavingsJar } = useStore();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm());

  const totalSaved = savingsJars.reduce((s, j) => s + j.currentValue, 0);
  const totalTarget = savingsJars.reduce((s, j) => s + j.targetValue, 0);
  const totalMonthly = savingsJars.reduce((s, j) => s + j.monthlyContribution, 0);
  const overallPct = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;

  const handleAdd = () => {
    if (!form.name || !form.targetValue) return;
    const j: SavingsJar = {
      id: generateId(),
      name: form.name!,
      emoji: form.emoji!,
      targetValue: Number(form.targetValue),
      currentValue: Number(form.currentValue) || 0,
      color: form.color!,
      monthlyContribution: Number(form.monthlyContribution) || 0,
      description: form.description,
      yieldRate: form.yieldRate ? Number(form.yieldRate) : undefined,
      yieldPeriod: form.yieldRate ? (form.yieldPeriod as YieldPeriod) : undefined,
    };
    addSavingsJar(j);
    setShowModal(false);
    setForm(emptyForm());
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Summary */}
      <div className="relative rounded-2xl bg-gradient-to-br from-purple-700 via-purple-600 to-pink-500 p-6 text-white overflow-hidden shadow-purple">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-white/30 -translate-y-10 translate-x-10" />
        </div>
        <div className="relative">
          <p className="text-purple-200 text-xs font-semibold uppercase tracking-wider mb-1">Total em Cofrinhos</p>
          <p className="font-display text-3xl font-semibold text-white mb-0.5">{formatCurrency(totalSaved)}</p>
          <p className="text-purple-200 text-sm">de {formatCurrency(totalTarget)} no total</p>

          <div className="mt-4 progress-bar bg-white/20 h-2.5">
            <div className="h-full rounded-full bg-white/80 transition-all duration-700"
              style={{ width: `${overallPct}%` }} />
          </div>

          <div className="flex items-center gap-4 mt-4 pt-3 border-t border-white/20">
            <div>
              <p className="text-purple-200 text-[10px] uppercase tracking-wider">Cofrinhos</p>
              <p className="text-white font-semibold">{savingsJars.length}</p>
            </div>
            <div className="w-px h-8 bg-white/20" />
            <div>
              <p className="text-purple-200 text-[10px] uppercase tracking-wider">Meta/mês</p>
              <p className="text-white font-semibold">{formatCurrency(totalMonthly)}</p>
            </div>
            <div className="w-px h-8 bg-white/20" />
            <div>
              <p className="text-purple-200 text-[10px] uppercase tracking-wider">Progresso Geral</p>
              <p className="text-white font-semibold">{overallPct.toFixed(1)}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Jars grid */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-700">Seus Cofrinhos ({savingsJars.length})</h3>
        <button onClick={() => { setForm(emptyForm()); setShowModal(true); }} className="gradient-btn flex items-center gap-1.5">
          <Plus size={16} /> Novo Cofrinho
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {savingsJars.map((jar) => (
          <div key={jar.id} className="group">
            <JarCard jar={jar} />
          </div>
        ))}
        {savingsJars.length === 0 && (
          <div className="col-span-3 text-center py-16 text-gray-400">
            <span className="text-4xl mb-3 block">🐷</span>
            <p className="text-sm font-medium">Nenhum cofrinho ainda. Crie o primeiro!</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display text-xl font-semibold text-gray-800 mb-5">Novo Cofrinho</h3>
            <div className="space-y-4">
              <div>
                <label className="form-label">Nome</label>
                <input className="input-field" placeholder="Ex: Viagem Europa" value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>

              {/* Emoji picker */}
              <div>
                <label className="form-label">Emoji</label>
                <div className="flex flex-wrap gap-2">
                  {EMOJIS.map((e) => (
                    <button key={e}
                      className={`w-9 h-9 rounded-lg text-xl flex items-center justify-center transition-all ${form.emoji === e ? 'bg-purple-100 ring-2 ring-purple-400 scale-110' : 'bg-gray-50 hover:bg-gray-100'}`}
                      onClick={() => setForm({ ...form, emoji: e })}>
                      {e}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color picker */}
              <div>
                <label className="form-label">Cor</label>
                <div className="flex gap-2">
                  {COLORS.map((c) => (
                    <button key={c}
                      className={`w-8 h-8 rounded-full transition-all ${form.color === c ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : 'hover:scale-105'}`}
                      style={{ backgroundColor: c }}
                      onClick={() => setForm({ ...form, color: c })} />
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">Meta (R$)</label>
                  <input type="number" className="input-field" placeholder="0,00" value={form.targetValue || ''}
                    onChange={(e) => setForm({ ...form, targetValue: parseFloat(e.target.value) || 0 })} />
                </div>
                <div>
                  <label className="form-label">Valor Atual (R$)</label>
                  <input type="number" className="input-field" placeholder="0,00" value={form.currentValue || ''}
                    onChange={(e) => setForm({ ...form, currentValue: parseFloat(e.target.value) || 0 })} />
                </div>
              </div>

              <div>
                <label className="form-label">Aporte Mensal (R$)</label>
                <input type="number" className="input-field" placeholder="Ex: 500,00" value={form.monthlyContribution || ''}
                  onChange={(e) => setForm({ ...form, monthlyContribution: parseFloat(e.target.value) || 0 })} />
                <p className="text-[10px] text-gray-400 mt-1">Meta de quanto você quer aportar por mês neste cofrinho</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">Rendimento (%)</label>
                  <input type="number" step="0.01" className="input-field" placeholder="Ex: 0.8" value={form.yieldRate || ''}
                    onChange={(e) => setForm({ ...form, yieldRate: parseFloat(e.target.value) || undefined })} />
                </div>
                <div>
                  <label className="form-label">Período</label>
                  <select className="input-field" value={form.yieldPeriod || 'mensal'}
                    onChange={(e) => setForm({ ...form, yieldPeriod: e.target.value as YieldPeriod })}>
                    <option value="diário">Diário</option>
                    <option value="mensal">Mensal</option>
                    <option value="anual">Anual</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="form-label">Descrição (opcional)</label>
                <input className="input-field" placeholder="Ex: Lisboa, Madrid e Paris!" value={form.description || ''}
                  onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>

              <div className="flex gap-3 pt-2">
                <button className="gradient-btn flex-1" onClick={handleAdd}>Criar Cofrinho</button>
                <button className="btn-outline flex-1" onClick={() => setShowModal(false)}>Cancelar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
