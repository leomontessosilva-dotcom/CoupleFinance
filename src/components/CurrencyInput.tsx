import { useState, useEffect } from 'react';

function fmt(value: number): string {
  if (!value) return '';
  return new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
}

export function parseCurrency(s: string): number {
  const str = (s ?? '').trim();
  if (!str) return 0;
  let cleaned = str;
  // pt-BR: "1.500,50" — periods are thousands sep, comma is decimal
  if (cleaned.includes('.') && cleaned.includes(',')) {
    cleaned = cleaned.replace(/\./g, '').replace(',', '.');
  } else if (cleaned.includes(',')) {
    // Only comma — treat as decimal separator
    cleaned = cleaned.replace(',', '.');
  }
  // Otherwise only period — treat as decimal (English style) or integer
  return parseFloat(cleaned) || 0;
}

interface Props {
  value: number;
  onChange: (v: number) => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

export function CurrencyInput({ value, onChange, placeholder = 'R$ 0,00', className, autoFocus, onKeyDown }: Props) {
  const [display, setDisplay] = useState(() => fmt(value));
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) setDisplay(fmt(value));
  }, [value, focused]);

  return (
    <input
      type="text"
      inputMode="decimal"
      className={className}
      placeholder={placeholder}
      autoFocus={autoFocus}
      value={display}
      onKeyDown={onKeyDown}
      onChange={(e) => setDisplay(e.target.value.replace(/[^0-9,.]/g, ''))}
      onFocus={() => {
        setFocused(true);
        // Strip thousands separators to make editing easier
        setDisplay((d) => d.replace(/\./g, ''));
      }}
      onBlur={() => {
        setFocused(false);
        const num = parseCurrency(display);
        onChange(num);
        setDisplay(fmt(num));
      }}
    />
  );
}
