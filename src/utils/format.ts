export const formatCurrency = (value: number): string =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export const formatDate = (dateStr: string): string =>
  new Date(dateStr + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });

export const formatShortDate = (dateStr: string): string =>
  new Date(dateStr + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });

export const formatMonth = (ym: string): string => {
  const [year, month] = ym.split('-');
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
};

export const formatMonthShort = (ym: string): string => {
  const [year, month] = ym.split('-');
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
};

export const getMonthRange = (ym: string): { start: string; end: string } => {
  const [year, month] = ym.split('-').map(Number);
  const start = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const end = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;
  return { start, end };
};

export const isInMonth = (dateStr: string, ym: string): boolean => {
  return dateStr.startsWith(ym);
};

export const generateId = (): string =>
  Math.random().toString(36).substring(2) + Date.now().toString(36);

export const prevMonth = (ym: string): string => {
  const [year, month] = ym.split('-').map(Number);
  const d = new Date(year, month - 2, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

export const nextMonth = (ym: string): string => {
  const [year, month] = ym.split('-').map(Number);
  const d = new Date(year, month, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

/** Add N months to a YYYY-MM-DD date, clamping the day to the month's last
 *  day when it doesn't exist (e.g. Jan 31 + 1 month = Feb 28/29). */
export const addMonthsToDate = (dateStr: string, months: number): string => {
  const [y, m, d] = dateStr.split('-').map(Number);
  const totalMonthsFromZero = (y * 12) + (m - 1) + months;
  const targetYear  = Math.floor(totalMonthsFromZero / 12);
  const targetMonth = (totalMonthsFromZero % 12) + 1;
  const lastDay = new Date(targetYear, targetMonth, 0).getDate();
  const day = Math.min(d, lastDay);
  return `${targetYear}-${String(targetMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
};

export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const categoryColors: Record<string, string> = {
  'Salário': '#7c3aed',
  'Freelance': '#a855f7',
  'Investimentos': '#10b981',
  'Outros Ganhos': '#6ee7b7',
  'Moradia': '#3b82f6',
  'Transporte': '#f59e0b',
  'Alimentação': '#ec4899',
  'Saúde': '#14b8a6',
  'Educação': '#8b5cf6',
  'Lazer': '#f472b6',
  'Assinaturas': '#6366f1',
  'Roupas': '#e879f9',
  'Viagem': '#0ea5e9',
  'Aporte': '#059669',
  'Outros': '#9ca3af',
  'Serviços': '#64748b',
};

/** Returns the salary for a given month using carry-forward logic.
 *  Finds the latest history entry with month <= ym. */
export function getSalaryForMonth(history: Record<string, number>, ym: string): number {
  const entries = Object.entries(history)
    .filter(([m]) => m <= ym)
    .sort((a, b) => a[0].localeCompare(b[0]));
  return entries.length > 0 ? entries[entries.length - 1][1] : 0;
}

export const investmentColors: Record<string, string> = {
  'CDB': '#7c3aed',
  'LCI': '#a855f7',
  'LCA': '#c084fc',
  'Ações': '#ec4899',
  'FII': '#f472b6',
  'Crypto': '#f59e0b',
  'Poupança': '#10b981',
  'Tesouro': '#3b82f6',
  'Outros': '#9ca3af',
};
