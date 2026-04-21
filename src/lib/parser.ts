import type { PaymentMethod, TransactionCategory } from '../types';

export interface ParsedTransaction {
  type: 'income' | 'expense';
  description: string;
  amount: number;
  date: string;
  category: TransactionCategory;
  paymentMethod?: PaymentMethod;
  jarMatch: string | null;
}

export interface ParsedDocument {
  docType: string;
  date: string;
  value: number;
  description: string;
  summary: string;
  transactions: ParsedTransaction[];
}

export async function parseDocument(
  file: File,
  docType: string,
  person: string,
): Promise<ParsedDocument> {
  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  const fileBase64 = btoa(binary);

  const res = await fetch('/api/parse', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileBase64, fileName: file.name, mimeType: file.type, docType, person }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(err.error ?? 'Parse failed');
  }

  return res.json();
}
