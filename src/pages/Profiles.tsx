import { useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useDropzone } from 'react-dropzone';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Upload, FileText, Trash2, Sparkles, CheckCircle, AlertCircle, Loader2, X, Pencil } from 'lucide-react';
import { useStore } from '../store/useStore';
import { formatCurrency, formatDate, isInMonth, formatMonthShort, prevMonth, nextMonth, formatFileSize, generateId, getSalaryForMonth } from '../utils/format';
import type { Person, DocumentType, UploadedDocument, Transaction, TransactionCategory } from '../types';
import { parseDocument } from '../lib/parser';
import type { ParsedTransaction } from '../lib/parser';

type ProfilePerson = 'Leonardo' | 'Serena';

/* ── AI Review Modal ────────────────────────────────────────── */
interface ReviewItem extends ParsedTransaction {
  selected: boolean;
  tempId: string;
}

function AIReviewModal({
  summary,
  items,
  onConfirm,
  onClose,
}: {
  summary: string;
  items: ReviewItem[];
  person?: ProfilePerson;
  onConfirm: (selected: ReviewItem[]) => void;
  onClose: () => void;
}) {
  const [list, setList] = useState<ReviewItem[]>(items);

  const toggle = (id: string) =>
    setList((prev) => prev.map((i) => (i.tempId === id ? { ...i, selected: !i.selected } : i)));

  const selected = list.filter((i) => i.selected);

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-panel"
        style={{ maxWidth: 600, display: 'flex', flexDirection: 'column' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--accent-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Sparkles size={14} color="var(--accent)" />
              </div>
              <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.2rem', fontWeight: 300, color: 'var(--text-1)' }}>
                Revisão da IA
              </h3>
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.5 }}>{summary}</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: 4 }}>
            <X size={16} />
          </button>
        </div>

        <p style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 12, fontWeight: 600 }}>
          Selecione os itens que deseja importar ({selected.length} de {list.length}):
        </p>

        {/* Items */}
        <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
          {list.map((item) => (
            <div
              key={item.tempId}
              onClick={() => toggle(item.tempId)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 12px',
                borderRadius: 10,
                border: `1px solid ${item.selected ? 'var(--accent)' : 'var(--border)'}`,
                background: item.selected ? 'var(--accent-bg)' : 'var(--surface-2)',
                cursor: 'pointer',
                transition: 'all 100ms',
              }}
            >
              <div style={{
                width: 18, height: 18, borderRadius: 5,
                border: `2px solid ${item.selected ? 'var(--accent)' : 'var(--border-strong)'}`,
                background: item.selected ? 'var(--accent)' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                {item.selected && <CheckCircle size={10} color="white" />}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {item.description}
                </p>
                <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>
                  {item.category} · {item.date}
                  {item.jarMatch ? ` · 🏦 Cofrinho: ${item.jarMatch}` : ''}
                </p>
              </div>

              <span style={{
                fontFamily: 'Fraunces, serif', fontSize: 13.5, fontWeight: 400,
                letterSpacing: '-0.01em', flexShrink: 0,
                color: item.type === 'income' ? 'var(--green)' : 'var(--red)',
              }}>
                {item.type === 'income' ? '+' : '−'}{formatCurrency(item.amount)}
              </span>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            className="btn-primary"
            style={{ flex: 1, justifyContent: 'center' }}
            onClick={() => onConfirm(selected)}
            disabled={selected.length === 0}
          >
            <CheckCircle size={14} /> Importar {selected.length > 0 ? `${selected.length} item${selected.length > 1 ? 's' : ''}` : ''}
          </button>
          <button className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={onClose}>
            Cancelar
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ── Person Profile ─────────────────────────────────────────── */
function PersonProfile({ person }: { person: ProfilePerson }) {
  const { transactions, fixedExpenses, documents, savingsJars, addDocument, deleteDocument, addTransaction, addToJar, currentMonth, salaryHistory, setSalaryForMonth } = useStore();

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [docType, setDocType] = useState<DocumentType>('Holerite');
  const [manualIncome, setManualIncome] = useState('');
  const [manualExpense, setManualExpense] = useState('');
  const [manualDesc, setManualDesc] = useState('');
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  const [editingSalary, setEditingSalary] = useState(false);
  const [salaryDraft, setSalaryDraft] = useState('');
  const [salaryFromMonth, setSalaryFromMonth] = useState(nextMonth(currentMonth));
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState('');
  const [reviewData, setReviewData] = useState<{ summary: string; items: ReviewItem[] } | null>(null);

  const isLeo = person === 'Leonardo';
  const accentColor = isLeo ? '#7c3aed' : '#ec4899';

  const personTx = transactions.filter((t) => t.person === person || t.person === 'Casal');
  const monthTx = personTx.filter((t) => isInMonth(t.date, currentMonth));
  const monthIncome = monthTx.filter((t) => t.type === 'income' && t.person === person).reduce((s, t) => s + t.amount, 0);
  const monthExpenses = monthTx.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const personalFixed = fixedExpenses.filter((f) => f.active && (f.person === person || f.person === 'Casal'));
  const personalFixedTotal = personalFixed.reduce((s, f) => s + f.amount, 0);

  const currentSalary = getSalaryForMonth(salaryHistory[person], currentMonth);

  const incomeChartData = [];
  for (let i = 5; i >= 0; i--) {
    let cur = currentMonth;
    for (let j = 0; j < i; j++) cur = prevMonth(cur);
    const tx = transactions.filter((t) => isInMonth(t.date, cur) && t.type === 'income' && t.person === person);
    incomeChartData.push({ name: formatMonthShort(cur), Receita: tx.reduce((s, t) => s + t.amount, 0) });
  }

  // Salary evolution: last 12 months using carry-forward
  const salaryChartData = [];
  for (let i = 11; i >= 0; i--) {
    let cur = currentMonth;
    for (let j = 0; j < i; j++) cur = prevMonth(cur);
    salaryChartData.push({ name: formatMonthShort(cur), Salário: getSalaryForMonth(salaryHistory[person], cur) });
  }

  const personDocs = documents.filter((d) => d.person === person);

  const onDrop = useCallback((files: File[]) => {
    if (files[0]) {
      setPendingFile(files[0]);
      setParseError('');
      setShowUploadModal(true);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': [], 'image/*': [] },
  });

  /* Trigger AI parse */
  const handleParseWithAI = async () => {
    if (!pendingFile) return;
    setParsing(true);
    setParseError('');
    try {
      const result = await parseDocument(pendingFile, docType, person);
      const items: ReviewItem[] = (result.transactions ?? []).map((t) => ({
        ...t,
        selected: true,
        tempId: generateId(),
      }));
      setReviewData({ summary: result.summary ?? 'Documento analisado.', items });
      setShowUploadModal(false);
    } catch (err: any) {
      setParseError(err?.message ?? 'Falha ao interpretar o documento.');
    } finally {
      setParsing(false);
    }
  };

  /* Confirm AI-parsed items */
  const handleConfirmParsed = (selected: ReviewItem[]) => {
    selected.forEach((item) => {
      // Find matching jar before creating the transaction
      let matchedJarId: string | undefined = undefined;
      if (item.jarMatch) {
        const jar = savingsJars.find((j) =>
          j.name.toLowerCase().includes(item.jarMatch!.toLowerCase()) ||
          item.jarMatch!.toLowerCase().includes(j.name.toLowerCase())
        );
        if (jar) {
          matchedJarId = jar.id;
          const delta = item.type === 'income' ? item.amount : -item.amount;
          addToJar(jar.id, delta);
        }
      }

      // Add transaction with optional jar link for contribution tracking
      const t: Transaction = {
        id: generateId(),
        type: item.type,
        category: item.category as TransactionCategory,
        description: item.description,
        amount: item.amount,
        date: item.date,
        person: person as Person,
        paymentMethod: item.paymentMethod,
        savingsJarId: matchedJarId,
      };
      addTransaction(t);
    });

    // Save the document record
    if (pendingFile) {
      const doc: UploadedDocument = {
        id: generateId(),
        name: `${docType} - ${pendingFile.name.replace(/\.[^.]+$/, '')}`,
        type: docType,
        person: person as Person,
        date: new Date().toISOString().split('T')[0],
        value: selected.filter((i) => i.type === 'income').reduce((s, i) => s + i.amount, 0) || undefined,
        fileName: pendingFile.name,
        fileSize: pendingFile.size,
      };
      addDocument(doc);
    }

    setReviewData(null);
    setPendingFile(null);
    setManualIncome('');
    setManualExpense('');
    setManualDesc('');
  };

  /* Save without AI parse — optionally creates manual transactions */
  const handleSaveDoc = () => {
    if (!pendingFile) return;
    const today = new Date().toISOString().split('T')[0];
    const desc = manualDesc.trim() || `${docType} - ${pendingFile.name.replace(/\.[^.]+$/, '')}`;
    const incomeAmt = parseFloat(manualIncome) || 0;
    const expenseAmt = parseFloat(manualExpense) || 0;

    if (incomeAmt > 0) {
      addTransaction({
        id: generateId(), type: 'income',
        category: docType === 'Holerite' ? 'Salário' : 'Outros Ganhos',
        description: desc, amount: incomeAmt, date: today, person: person as Person,
      });
    }
    if (expenseAmt > 0) {
      addTransaction({
        id: generateId(), type: 'expense',
        category: 'Outros',
        description: desc, amount: expenseAmt, date: today, person: person as Person,
      });
    }

    addDocument({
      id: generateId(),
      name: desc,
      type: docType,
      person: person as Person,
      date: today,
      value: incomeAmt || expenseAmt || undefined,
      fileName: pendingFile.name,
      fileSize: pendingFile.size,
    });

    setShowUploadModal(false);
    setPendingFile(null);
    setManualIncome('');
    setManualExpense('');
    setManualDesc('');
  };

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Profile header */}
      <div style={{
        borderRadius: 16, padding: '24px 28px',
        background: isLeo
          ? 'linear-gradient(135deg, #6D28D9 0%, #4C1D95 100%)'
          : 'linear-gradient(135deg, #D5197A 0%, #9D174D 100%)',
        color: 'white', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.07)' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, position: 'relative' }}>
          <div style={{
            width: 60, height: 60, borderRadius: 16,
            background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 26, fontWeight: 700, fontFamily: 'Fraunces, serif',
          }}>
            {person.charAt(0)}
          </div>
          <div>
            <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.6rem', fontWeight: 300, marginBottom: 2 }}>{person}</h2>
            <p style={{ fontSize: 12, opacity: 0.65 }}>{isLeo ? 'Engenheiro de Software' : 'Designer UX/UI'}</p>
            <div style={{ display: 'flex', gap: 20, marginTop: 12, alignItems: 'flex-end' }}>
              {/* Editable salary */}
              <div>
                <p style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.6, marginBottom: 2 }}>Salário Atual</p>
                {editingSalary ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <input
                      type="number"
                      value={salaryDraft}
                      onChange={(e) => setSalaryDraft(e.target.value)}
                      autoFocus
                      placeholder="Novo valor"
                      style={{ width: 110, background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.4)', borderRadius: 6, padding: '2px 6px', fontSize: 12, color: 'white', fontFamily: 'inherit' }}
                    />
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ fontSize: 9, opacity: 0.7 }}>A partir de</span>
                      <input
                        type="month"
                        value={salaryFromMonth}
                        onChange={(e) => setSalaryFromMonth(e.target.value)}
                        style={{ background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.4)', borderRadius: 6, padding: '2px 4px', fontSize: 11, color: 'white', fontFamily: 'inherit', colorScheme: 'dark' }}
                      />
                    </div>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button onClick={() => { setSalaryForMonth(person, salaryFromMonth, Number(salaryDraft) || 0); setEditingSalary(false); }}
                        style={{ background: 'rgba(255,255,255,0.25)', border: 'none', cursor: 'pointer', color: 'white', padding: '2px 8px', borderRadius: 5, fontSize: 11 }}>
                        Salvar
                      </button>
                      <button onClick={() => setEditingSalary(false)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.6)', padding: 2 }}>
                        <X size={13} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <p style={{ fontSize: 13, fontWeight: 600 }}>{formatCurrency(currentSalary)}</p>
                    <button onClick={() => { setSalaryDraft(String(currentSalary)); setSalaryFromMonth(nextMonth(currentMonth)); setEditingSalary(true); }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.6)', padding: 2 }}>
                      <Pencil size={11} />
                    </button>
                  </div>
                )}
              </div>
              {[
                { label: 'Receita Mês', val: formatCurrency(monthIncome) },
                { label: 'Despesas', val: formatCurrency(monthExpenses) },
              ].map(({ label, val }) => (
                <div key={label}>
                  <p style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.6, marginBottom: 2 }}>{label}</p>
                  <p style={{ fontSize: 13, fontWeight: 600 }}>{val}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Income chart */}
        <div className="card p-5">
          <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)', marginBottom: 16 }}>Histórico de Receitas</h3>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={incomeChartData}>
              <defs>
                <linearGradient id={`grad${person}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={accentColor} stopOpacity={0.15} />
                  <stop offset="95%" stopColor={accentColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false}
                tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: any) => formatCurrency(Number(v))} />
              <Area type="monotone" dataKey="Receita" stroke={accentColor} strokeWidth={2.5}
                fill={`url(#grad${person})`} dot={{ fill: accentColor, r: 3 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Fixed expenses */}
        <div className="card p-5">
          <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)', marginBottom: 16 }}>
            Gastos Fixos · {formatCurrency(personalFixedTotal)}/mês
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, maxHeight: 200, overflowY: 'auto' }}>
            {personalFixed.map((f) => (
              <div key={f.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 4px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: accentColor, flexShrink: 0 }} />
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-1)' }}>{f.name}</p>
                    <p style={{ fontSize: 10.5, color: 'var(--text-3)' }}>{f.category} · Dia {f.dueDay}</p>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-1)', fontFamily: 'Fraunces, serif' }}>{formatCurrency(f.amount)}</p>
                  <p style={{ fontSize: 10, color: 'var(--text-3)' }}>{f.person === 'Casal' ? 'Compartilhado' : 'Pessoal'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Salary evolution chart */}
      <div className="card p-5">
        <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)', marginBottom: 4 }}>Evolução do Salário</h3>
        <p style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 16 }}>Últimos 12 meses</p>
        {salaryChartData.every((d) => d.Salário === 0) ? (
          <p style={{ fontSize: 12, color: 'var(--text-3)', textAlign: 'center', padding: '24px 0' }}>
            Nenhum histórico de salário ainda. Clique no lápis para registrar.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={salaryChartData}>
              <defs>
                <linearGradient id={`salGrad${person}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={accentColor} stopOpacity={0.18} />
                  <stop offset="95%" stopColor={accentColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} interval={1} />
              <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false}
                tickFormatter={(v) => `R$${(v / 1000).toFixed(1)}k`} width={48} />
              <Tooltip formatter={(v: any) => formatCurrency(Number(v))} />
              <Area type="stepAfter" dataKey="Salário" stroke={accentColor} strokeWidth={2}
                fill={`url(#salGrad${person})`} dot={{ fill: accentColor, r: 3 }} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Upload area */}
      <div className="card p-5">
        <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)', marginBottom: 16 }}>Documentos & IA</h3>

        <div
          {...getRootProps()}
          style={{
            border: `2px dashed ${isDragActive ? 'var(--accent)' : 'var(--border-strong)'}`,
            borderRadius: 12, padding: '32px 24px', textAlign: 'center', cursor: 'pointer',
            background: isDragActive ? 'var(--accent-bg)' : 'var(--surface-2)',
            transition: 'all 150ms',
          }}
        >
          <input {...getInputProps()} />
          <Upload size={28} color={isDragActive ? 'var(--accent)' : 'var(--text-3)'} style={{ margin: '0 auto 10px' }} />
          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)', marginBottom: 4 }}>
            {isDragActive ? 'Solte aqui!' : 'Arraste seu holerite, NF ou extrato'}
          </p>
          <p style={{ fontSize: 11.5, color: 'var(--text-3)' }}>PDF, JPG, PNG · ou clique para selecionar</p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 12 }}>
            <Sparkles size={12} color="var(--accent)" />
            <span style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 600 }}>
              IA interpreta e preenche automaticamente
            </span>
          </div>
        </div>

        {/* Documents list */}
        {personDocs.length > 0 && (
          <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {personDocs.map((doc) => (
              <div key={doc.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 12px', borderRadius: 10, background: 'var(--surface-2)',
                border: '1px solid var(--border)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 9, background: 'var(--accent-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FileText size={15} color="var(--accent)" />
                  </div>
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-1)' }}>{doc.name}</p>
                    <p style={{ fontSize: 10.5, color: 'var(--text-3)' }}>
                      {formatDate(doc.date)}
                      {doc.value ? ` · ${formatCurrency(doc.value)}` : ''}
                      {doc.fileSize ? ` · ${formatFileSize(doc.fileSize)}` : ''}
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="pill pill-purple" style={{ fontSize: 10 }}>{doc.type}</span>
                  <button onClick={() => deleteDocument(doc.id)} style={{ width: 28, height: 28, borderRadius: 8, border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--red-bg)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}>
                    <Trash2 size={13} color="var(--red)" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload modal */}
      {showUploadModal && createPortal(
        <div className="modal-overlay" onClick={() => setShowUploadModal(false)}>
          <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.2rem', fontWeight: 300, color: 'var(--text-1)', marginBottom: 4 }}>
              Salvar Documento
            </h3>
            <p style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 20 }}>{pendingFile?.name}</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label className="f-label">Tipo do documento</label>
                <select className="input" value={docType} onChange={(e) => setDocType(e.target.value as DocumentType)}>
                  {(['Holerite', 'Nota Fiscal', 'Comprovante', 'Contrato', 'Outro'] as DocumentType[]).map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="f-label">Descrição (opcional)</label>
                <input className="input" placeholder={`${docType} de ${person}`} value={manualDesc}
                  onChange={(e) => setManualDesc(e.target.value)} />
              </div>

              {/* Separator */}
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
                  Lançar valores manualmente (opcional)
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <label className="f-label" style={{ color: 'var(--green)' }}>Entrada (R$)</label>
                    <input type="number" className="input" placeholder="0,00" value={manualIncome}
                      onChange={(e) => setManualIncome(e.target.value)} />
                  </div>
                  <div>
                    <label className="f-label" style={{ color: 'var(--red)' }}>Saída (R$)</label>
                    <input type="number" className="input" placeholder="0,00" value={manualExpense}
                      onChange={(e) => setManualExpense(e.target.value)} />
                  </div>
                </div>
                <p style={{ fontSize: 10.5, color: 'var(--text-3)', marginTop: 8 }}>
                  Se preenchidos, cria transações automaticamente na sua conta.
                </p>
              </div>

              {parseError && (
                <div style={{ padding: '10px 12px', background: 'var(--red-bg)', borderRadius: 8, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <AlertCircle size={14} color="var(--red)" style={{ marginTop: 1, flexShrink: 0 }} />
                  <p style={{ fontSize: 12, color: 'var(--red)' }}>{parseError}</p>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 4 }}>
                <button
                  className="btn-primary"
                  style={{ justifyContent: 'center' }}
                  onClick={handleParseWithAI}
                  disabled={parsing}
                >
                  {parsing
                    ? <><Loader2 size={14} className="animate-spin" /> Interpretando...</>
                    : <><Sparkles size={14} /> Interpretar com IA</>
                  }
                </button>
                <button className="btn-secondary" style={{ justifyContent: 'center' }} onClick={handleSaveDoc}>
                  Salvar{(manualIncome || manualExpense) ? ' e lançar valores' : ' sem interpretar'}
                </button>
                <button className="btn-secondary" style={{ justifyContent: 'center', color: 'var(--text-3)' }}
                  onClick={() => { setShowUploadModal(false); setPendingFile(null); setManualIncome(''); setManualExpense(''); setManualDesc(''); }}>
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* AI Review Modal */}
      {reviewData && (
        <AIReviewModal
          summary={reviewData.summary}
          items={reviewData.items}
          person={person}
          onConfirm={handleConfirmParsed}
          onClose={() => { setReviewData(null); setPendingFile(null); }}
        />
      )}
    </div>
  );
}

export default function Profiles() {
  const [tab, setTab] = useState<ProfilePerson>('Leonardo');

  return (
    <div className="animate-fade-in">
      <div className="tab-bar" style={{ marginBottom: 24 }}>
        <button className={`tab-btn ${tab === 'Leonardo' ? 'active' : ''}`} onClick={() => setTab('Leonardo')}>
          Leonardo
        </button>
        <button className={`tab-btn ${tab === 'Serena' ? 'active' : ''}`} onClick={() => setTab('Serena')}>
          Serena
        </button>
      </div>
      <PersonProfile person={tab} />
    </div>
  );
}
