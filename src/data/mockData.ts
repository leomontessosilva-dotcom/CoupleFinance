import type { Transaction, FixedExpense, Investment, SavingsJar, UploadedDocument } from '../types';

export const mockTransactions: Transaction[] = [
  // April 2026 Income
  { id: 't1', type: 'income', category: 'Salário', description: 'Salário Leonardo - Abril', amount: 8500, date: '2026-04-05', person: 'Leonardo' },
  { id: 't2', type: 'income', category: 'Salário', description: 'Salário Serena - Abril', amount: 6200, date: '2026-04-05', person: 'Serena' },
  { id: 't3', type: 'income', category: 'Freelance', description: 'Projeto design extra', amount: 1200, date: '2026-04-12', person: 'Leonardo' },
  { id: 't4', type: 'income', category: 'Investimentos', description: 'Rendimento CDB', amount: 340, date: '2026-04-15', person: 'Casal' },
  // April 2026 Expenses
  { id: 't5', type: 'expense', category: 'Moradia', description: 'Aluguel Abril', amount: 2800, date: '2026-04-01', person: 'Casal' },
  { id: 't6', type: 'expense', category: 'Alimentação', description: 'Supermercado', amount: 890, date: '2026-04-08', person: 'Casal' },
  { id: 't7', type: 'expense', category: 'Transporte', description: 'Combustível', amount: 320, date: '2026-04-10', person: 'Leonardo' },
  { id: 't8', type: 'expense', category: 'Saúde', description: 'Plano de saúde', amount: 580, date: '2026-04-05', person: 'Casal' },
  { id: 't9', type: 'expense', category: 'Lazer', description: 'Restaurante jantar', amount: 240, date: '2026-04-14', person: 'Casal' },
  { id: 't10', type: 'expense', category: 'Assinaturas', description: 'Netflix / Spotify', amount: 89, date: '2026-04-10', person: 'Casal' },
  { id: 't11', type: 'expense', category: 'Roupas', description: 'Compras shopping', amount: 430, date: '2026-04-16', person: 'Serena' },
  { id: 't12', type: 'expense', category: 'Alimentação', description: 'iFood semana', amount: 185, date: '2026-04-18', person: 'Casal' },
  { id: 't13', type: 'expense', category: 'Educação', description: 'Curso inglês', amount: 360, date: '2026-04-05', person: 'Serena' },
  { id: 't14', type: 'expense', category: 'Transporte', description: 'Uber semana', amount: 156, date: '2026-04-20', person: 'Serena' },
  { id: 't15', type: 'expense', category: 'Outros', description: 'Farmácia', amount: 98, date: '2026-04-19', person: 'Casal' },
  // March 2026
  { id: 't16', type: 'income', category: 'Salário', description: 'Salário Leonardo - Março', amount: 8500, date: '2026-03-05', person: 'Leonardo' },
  { id: 't17', type: 'income', category: 'Salário', description: 'Salário Serena - Março', amount: 6200, date: '2026-03-05', person: 'Serena' },
  { id: 't18', type: 'income', category: 'Freelance', description: 'Consultoria', amount: 800, date: '2026-03-20', person: 'Leonardo' },
  { id: 't19', type: 'expense', category: 'Moradia', description: 'Aluguel Março', amount: 2800, date: '2026-03-01', person: 'Casal' },
  { id: 't20', type: 'expense', category: 'Alimentação', description: 'Supermercado', amount: 750, date: '2026-03-07', person: 'Casal' },
  { id: 't21', type: 'expense', category: 'Viagem', description: 'Viagem fds', amount: 1200, date: '2026-03-15', person: 'Casal' },
  { id: 't22', type: 'expense', category: 'Saúde', description: 'Consulta médica', amount: 350, date: '2026-03-10', person: 'Leonardo' },
  { id: 't23', type: 'expense', category: 'Transporte', description: 'IPVA parcela', amount: 620, date: '2026-03-05', person: 'Leonardo' },
  // February 2026
  { id: 't24', type: 'income', category: 'Salário', description: 'Salário Leonardo - Fevereiro', amount: 8500, date: '2026-02-05', person: 'Leonardo' },
  { id: 't25', type: 'income', category: 'Salário', description: 'Salário Serena - Fevereiro', amount: 6200, date: '2026-02-05', person: 'Serena' },
  { id: 't26', type: 'expense', category: 'Moradia', description: 'Aluguel Fevereiro', amount: 2800, date: '2026-02-01', person: 'Casal' },
  { id: 't27', type: 'expense', category: 'Lazer', description: 'Carnaval', amount: 1800, date: '2026-02-28', person: 'Casal' },
  { id: 't28', type: 'expense', category: 'Alimentação', description: 'Supermercado', amount: 680, date: '2026-02-08', person: 'Casal' },
];

export const mockFixedExpenses: FixedExpense[] = [
  { id: 'f1', name: 'Aluguel', amount: 2800, dueDay: 1, category: 'Moradia', person: 'Casal', active: true },
  { id: 'f2', name: 'Condomínio', amount: 420, dueDay: 10, category: 'Moradia', person: 'Casal', active: true },
  { id: 'f3', name: 'Luz/Água', amount: 280, dueDay: 15, category: 'Moradia', person: 'Casal', active: true },
  { id: 'f4', name: 'Internet', amount: 120, dueDay: 12, category: 'Serviços', person: 'Casal', active: true },
  { id: 'f5', name: 'Plano de Saúde', amount: 580, dueDay: 5, category: 'Saúde', person: 'Casal', active: true },
  { id: 'f6', name: 'Financiamento Carro', amount: 890, dueDay: 20, category: 'Transporte', person: 'Leonardo', active: true },
  { id: 'f7', name: 'Curso de Inglês', amount: 360, dueDay: 5, category: 'Educação', person: 'Serena', active: true },
  { id: 'f8', name: 'Academia', amount: 110, dueDay: 1, category: 'Saúde', person: 'Leonardo', active: true },
  { id: 'f9', name: 'Academia', amount: 110, dueDay: 1, category: 'Saúde', person: 'Serena', active: true },
  { id: 'f10', name: 'Netflix + Spotify + Prime', amount: 89, dueDay: 10, category: 'Assinaturas', person: 'Casal', active: true },
  { id: 'f11', name: 'Celular Leonardo', amount: 85, dueDay: 18, category: 'Serviços', person: 'Leonardo', active: true },
  { id: 'f12', name: 'Celular Serena', amount: 85, dueDay: 18, category: 'Serviços', person: 'Serena', active: true },
  { id: 'f13', name: 'Plano Dental', amount: 130, dueDay: 8, category: 'Saúde', person: 'Casal', active: false },
];

export const mockInvestments: Investment[] = [
  { id: 'i1', name: 'CDB Nubank', type: 'CDB', institution: 'Nubank', initialValue: 15000, currentValue: 16840, date: '2025-01-15', person: 'Leonardo', monthlyContribution: 500 },
  { id: 'i2', name: 'Tesouro IPCA+', type: 'Tesouro', institution: 'Tesouro Direto', initialValue: 10000, currentValue: 11250, date: '2025-03-01', person: 'Casal', monthlyContribution: 300 },
  { id: 'i3', name: 'FII HGLG11', type: 'FII', institution: 'XP Investimentos', initialValue: 8000, currentValue: 8920, date: '2025-06-10', person: 'Leonardo', monthlyContribution: 400 },
  { id: 'i4', name: 'Ações PETR4', type: 'Ações', institution: 'Clear Corretora', initialValue: 5000, currentValue: 6150, date: '2025-09-20', person: 'Leonardo' },
  { id: 'i5', name: 'LCI Banco Inter', type: 'LCI', institution: 'Banco Inter', initialValue: 12000, currentValue: 12980, date: '2025-11-01', person: 'Serena', monthlyContribution: 600 },
  { id: 'i6', name: 'Poupança Emergência', type: 'Poupança', institution: 'Itaú', initialValue: 5000, currentValue: 5420, date: '2024-06-01', person: 'Casal', monthlyContribution: 200 },
  { id: 'i7', name: 'Bitcoin', type: 'Crypto', institution: 'Binance', initialValue: 2000, currentValue: 3180, date: '2025-01-01', person: 'Leonardo' },
];

export const mockSavingsJars: SavingsJar[] = [
  { id: 's1', name: 'Viagem Europa', emoji: '✈️', targetValue: 18000, currentValue: 7500, color: '#7c3aed', monthlyContribution: 1000, description: 'Lisboa, Madrid e Paris!' },
  { id: 's2', name: 'Fundo de Emergência', emoji: '🛡️', targetValue: 30000, currentValue: 18400, color: '#ec4899', monthlyContribution: 800, description: '6 meses de gastos' },
  { id: 's3', name: 'Casa Própria', emoji: '🏡', targetValue: 150000, currentValue: 28000, color: '#10b981', monthlyContribution: 2000, description: 'Entrada do apartamento' },
  { id: 's4', name: 'Carro Novo', emoji: '🚗', targetValue: 45000, currentValue: 12000, color: '#f59e0b', monthlyContribution: 500, description: 'Troca do carro em 2027' },
  { id: 's5', name: 'Casamento', emoji: '💍', targetValue: 25000, currentValue: 8000, color: '#f472b6', monthlyContribution: 700, description: 'O grande dia!' },
];

export const mockDocuments: UploadedDocument[] = [
  { id: 'd1', name: 'Holerite Abril 2026', type: 'Holerite', person: 'Leonardo', date: '2026-04-05', value: 8500, fileName: 'holerite_leo_abr26.pdf', fileSize: 245000 },
  { id: 'd2', name: 'Holerite Abril 2026', type: 'Holerite', person: 'Serena', date: '2026-04-05', value: 6200, fileName: 'holerite_serena_abr26.pdf', fileSize: 198000 },
  { id: 'd3', name: 'Holerite Março 2026', type: 'Holerite', person: 'Leonardo', date: '2026-03-05', value: 8500, fileName: 'holerite_leo_mar26.pdf', fileSize: 241000 },
  { id: 'd4', name: 'Holerite Março 2026', type: 'Holerite', person: 'Serena', date: '2026-03-05', value: 6200, fileName: 'holerite_serena_mar26.pdf', fileSize: 195000 },
  { id: 'd5', name: 'NF Consultoria Mar', type: 'Nota Fiscal', person: 'Leonardo', date: '2026-03-22', value: 800, fileName: 'nf_consultoria_mar26.pdf', fileSize: 120000 },
];
