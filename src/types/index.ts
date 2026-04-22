export type Person = 'Leonardo' | 'Serena' | 'Casal';

export type TransactionType = 'income' | 'expense';

export type TransactionCategory =
  | 'Salário' | 'Freelance' | 'Investimentos' | 'Outros Ganhos'
  | 'Moradia' | 'Transporte' | 'Alimentação' | 'Saúde' | 'Educação'
  | 'Lazer' | 'Assinaturas' | 'Roupas' | 'Viagem' | 'Outros';

export type PaymentMethod = 'credito' | 'debito' | 'pix' | 'dinheiro' | 'outro';

export interface Transaction {
  id: string;
  type: TransactionType;
  category: TransactionCategory;
  description: string;
  amount: number;
  date: string; // ISO date string
  person: Person;
  paymentMethod?: PaymentMethod;
  savingsJarId?: string; // links transaction to a cofrinho contribution
}

export type FixedExpenseCategory =
  | 'Moradia' | 'Transporte' | 'Alimentação' | 'Saúde' | 'Educação'
  | 'Lazer' | 'Assinaturas' | 'Serviços' | 'Outros';

export interface FixedExpense {
  id: string;
  name: string;
  amount: number;
  dueDay: number;
  category: FixedExpenseCategory;
  person: Person;
  active: boolean;
}

export type InvestmentType = 'CDB' | 'LCI' | 'LCA' | 'Ações' | 'FII' | 'Crypto' | 'Poupança' | 'Tesouro' | 'Outros';

export interface Investment {
  id: string;
  name: string;
  type: InvestmentType;
  institution: string;
  initialValue: number;
  currentValue: number;
  date: string;
  person: Person;
  monthlyContribution?: number;
}

export type YieldPeriod = 'diário' | 'mensal' | 'anual';

export interface SavingsJar {
  id: string;
  name: string;
  emoji: string;
  targetValue: number;
  currentValue: number;
  color: string;
  monthlyContribution: number;
  description?: string;
  yieldRate?: number;     // percentage, e.g. 0.8 = 0.8%
  yieldPeriod?: YieldPeriod;
}

export interface CreditCard {
  id: string;
  name: string;       // "Nubank Leo", "Itaú Casal"
  limit: number;
  person: Person;
  color: string;      // hex color
}

export type DocumentType = 'Holerite' | 'Nota Fiscal' | 'Comprovante' | 'Contrato' | 'Outro';

export interface UploadedDocument {
  id: string;
  name: string;
  type: DocumentType;
  person: Person;
  date: string;
  value?: number;
  fileName: string;
  fileSize?: number;
}
