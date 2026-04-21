import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Upload, FileText, Trash2 } from 'lucide-react';
import { useStore } from '../store/useStore';
import { formatCurrency, formatDate, isInMonth, formatMonthShort, prevMonth, formatFileSize, generateId } from '../utils/format';
import type { Person, DocumentType, UploadedDocument } from '../types';

type ProfilePerson = 'Leonardo' | 'Serena';

function PersonProfile({ person }: { person: ProfilePerson }) {
  const { transactions, fixedExpenses, documents, addDocument, deleteDocument, currentMonth } = useStore();
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [docType, setDocType] = useState<DocumentType>('Holerite');
  const [docValue, setDocValue] = useState('');
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  const isLeo = person === 'Leonardo';
  const colorFrom = isLeo ? 'from-purple-500' : 'from-pink-400';
  const colorTo = isLeo ? 'to-purple-700' : 'to-pink-600';
  const accentColor = isLeo ? '#7c3aed' : '#ec4899';

  const personTx = transactions.filter((t) => t.person === person || t.person === 'Casal');
  const monthTx = personTx.filter((t) => isInMonth(t.date, currentMonth));
  const monthIncome = monthTx.filter((t) => t.type === 'income' && (t.person === person)).reduce((s, t) => s + t.amount, 0);
  const monthExpenses = monthTx.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const personalFixed = fixedExpenses.filter((f) => f.active && (f.person === person || f.person === 'Casal'));
  const personalFixedTotal = personalFixed.reduce((s, f) => s + f.amount, 0);

  // Chart: last 6 months income
  const chartData = [];
  let m = currentMonth;
  for (let i = 5; i >= 0; i--) {
    let cur = m;
    for (let j = 0; j < i; j++) cur = prevMonth(cur);
    const tx = transactions.filter((t) => isInMonth(t.date, cur) && t.type === 'income' && t.person === person);
    const income = tx.reduce((s, t) => s + t.amount, 0);
    chartData.push({ name: formatMonthShort(cur), Receita: income });
  }

  const personDocs = documents.filter((d) => d.person === person);

  const onDrop = useCallback((files: File[]) => {
    if (files[0]) {
      setPendingFile(files[0]);
      setShowUploadModal(true);
    }
  }, []);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { 'application/pdf': [], 'image/*': [] } });

  const handleSaveDoc = () => {
    if (!pendingFile) return;
    const doc: UploadedDocument = {
      id: generateId(),
      name: `${docType} - ${pendingFile.name.replace(/\.[^.]+$/, '')}`,
      type: docType,
      person: person as Person,
      date: new Date().toISOString().split('T')[0],
      value: docValue ? parseFloat(docValue) : undefined,
      fileName: pendingFile.name,
      fileSize: pendingFile.size,
    };
    addDocument(doc);
    setShowUploadModal(false);
    setPendingFile(null);
    setDocValue('');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Profile header */}
      <div className={`relative rounded-2xl bg-gradient-to-br ${colorFrom} ${colorTo} p-6 text-white overflow-hidden shadow-purple`}>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-white/30 -translate-y-10 translate-x-10" />
        </div>
        <div className="relative flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-3xl font-bold shadow-inner">
            {person.charAt(0)}
          </div>
          <div>
            <h2 className="font-display text-2xl font-semibold">{person}</h2>
            <p className="text-white/70 text-sm mt-0.5">{isLeo ? 'Engenheiro de Software' : 'Designer UX/UI'}</p>
            <div className="flex items-center gap-4 mt-3">
              <div>
                <p className="text-white/60 text-[10px] uppercase tracking-wider">Salário</p>
                <p className="font-semibold text-sm">{formatCurrency(isLeo ? 8500 : 6200)}</p>
              </div>
              <div className="w-px h-8 bg-white/20" />
              <div>
                <p className="text-white/60 text-[10px] uppercase tracking-wider">Receita Mês</p>
                <p className="font-semibold text-sm">{formatCurrency(monthIncome)}</p>
              </div>
              <div className="w-px h-8 bg-white/20" />
              <div>
                <p className="text-white/60 text-[10px] uppercase tracking-wider">Despesas</p>
                <p className="font-semibold text-sm">{formatCurrency(monthExpenses)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Income chart */}
        <div className="card p-5">
          <h3 className="font-semibold text-gray-800 mb-4">Histórico de Receitas</h3>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={chartData}>
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
          <h3 className="font-semibold text-gray-800 mb-4">Gastos Fixos ({formatCurrency(personalFixedTotal)}/mês)</h3>
          <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
            {personalFixed.map((f) => (
              <div key={f.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: accentColor }} />
                  <div>
                    <p className="text-xs font-semibold text-gray-700">{f.name}</p>
                    <p className="text-[10px] text-gray-400">{f.category} · Dia {f.dueDay}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold text-gray-800">{formatCurrency(f.amount)}</p>
                  <span className={`text-[10px] ${f.person === 'Casal' ? 'text-purple-500' : 'text-gray-400'}`}>
                    {f.person === 'Casal' ? 'Compartilhado' : 'Pessoal'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Upload area */}
      <div className="card p-5">
        <h3 className="font-semibold text-gray-800 mb-4">Documentos</h3>

        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
            isDragActive
              ? 'border-purple-400 bg-purple-50'
              : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50/50'
          }`}
        >
          <input {...getInputProps()} />
          <Upload size={28} className={`mx-auto mb-3 ${isDragActive ? 'text-purple-500' : 'text-gray-300'}`} />
          <p className="text-sm font-semibold text-gray-600">
            {isDragActive ? 'Solte aqui!' : 'Arraste seus holerites ou notas fiscais'}
          </p>
          <p className="text-xs text-gray-400 mt-1">PDF, JPG, PNG · ou clique para selecionar</p>
        </div>

        {/* Documents list */}
        {personDocs.length > 0 && (
          <div className="mt-4 space-y-2">
            {personDocs.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-purple-100 flex items-center justify-center">
                    <FileText size={16} className="text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-700">{doc.name}</p>
                    <p className="text-[10px] text-gray-400">
                      {formatDate(doc.date)}
                      {doc.value ? ` · ${formatCurrency(doc.value)}` : ''}
                      {doc.fileSize ? ` · ${formatFileSize(doc.fileSize)}` : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <span className="badge bg-purple-50 text-purple-600 mr-2">{doc.type}</span>
                  <button onClick={() => deleteDocument(doc.id)} className="w-7 h-7 rounded-lg hover:bg-red-50 flex items-center justify-center transition-colors">
                    <Trash2 size={13} className="text-red-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload modal */}
      {showUploadModal && (
        <div className="modal-overlay" onClick={() => setShowUploadModal(false)}>
          <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display text-xl font-semibold text-gray-800 mb-1">Salvar Documento</h3>
            <p className="text-sm text-gray-400 mb-5">{pendingFile?.name}</p>
            <div className="space-y-4">
              <div>
                <label className="form-label">Tipo do documento</label>
                <select className="select-field" value={docType} onChange={(e) => setDocType(e.target.value as DocumentType)}>
                  {(['Holerite', 'Nota Fiscal', 'Comprovante', 'Contrato', 'Outro'] as DocumentType[]).map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="form-label">Valor (opcional)</label>
                <input type="number" className="input-field" placeholder="R$ 0,00" value={docValue}
                  onChange={(e) => setDocValue(e.target.value)} />
              </div>
              <div className="flex gap-3 pt-2">
                <button className="gradient-btn flex-1" onClick={handleSaveDoc}>Salvar</button>
                <button className="btn-outline flex-1" onClick={() => setShowUploadModal(false)}>Cancelar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Profiles() {
  const [tab, setTab] = useState<ProfilePerson>('Leonardo');

  return (
    <div className="animate-fade-in">
      <div className="flex gap-2 mb-6">
        <button className={`tab-btn ${tab === 'Leonardo' ? 'tab-active' : 'tab-inactive'}`} onClick={() => setTab('Leonardo')}>
          Leonardo
        </button>
        <button className={`tab-btn ${tab === 'Serena' ? 'tab-active' : 'tab-inactive'}`} onClick={() => setTab('Serena')}>
          Serena
        </button>
      </div>
      <PersonProfile person={tab} />
    </div>
  );
}
