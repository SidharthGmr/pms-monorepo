'use client';
import { Input } from '@/components/ui/input';
import { forwardRef, useEffect, useState } from 'react';

/**
 * Indian grouping, to match the rupee amounts these forms deal in: 12,000.00 and
 * 1,20,000.00 rather than 120,000.00. Change this one constant to switch the whole app.
 */
const LOCALE = 'en-IN';

interface CurrencyInputProps {
  /** `''` means the field is empty, which is different from a price of zero. */
  value: number | '' | null | undefined;
  onChange: (value: number | '') => void;
  /** Decimals shown once the field loses focus. */
  decimals?: number;
  /** Symbol rendered inside the field. Pass `null` for a bare number. */
  prefix?: string | null;
  id?: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  onBlur?: () => void;
}

const group = (value: number, decimals: number) =>
  value.toLocaleString(LOCALE, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

/** Everything except digits, one dot and a leading minus - so pasted "₹1,299" still works. */
const toRaw = (text: string) => {
  const cleaned = text.replace(/[^\d.-]/g, '');
  const negative = cleaned.startsWith('-');
  const [whole = '', ...rest] = cleaned.replace(/-/g, '').split('.');
  const decimalPart = rest.length ? `.${rest.join('')}` : '';
  return `${negative ? '-' : ''}${whole}${decimalPart}`;
};

/**
 * A money field that reads like money. `type="number"` cannot show separators at all -
 * browsers reject any non-numeric character - so this is a text field that formats on
 * blur and hands the caller a plain number.
 */
export const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(function CurrencyInput(
  { value, onChange, decimals = 2, prefix = '₹', id, placeholder = '0.00', className, disabled, required, onBlur },
  ref
) {
  const [text, setText] = useState('');
  const [focused, setFocused] = useState(false);

  // While typing, the field owns its own text; outside of that it mirrors the value it
  // is given, so a form reset or a programmatic change shows up.
  useEffect(() => {
    if (focused) return;
    setText(value === '' || value === null || value === undefined || Number.isNaN(value) ? '' : group(Number(value), decimals));
  }, [value, decimals, focused]);

  return (
    <div className="relative">
      {prefix && (
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">{prefix}</span>
      )}
      <Input
        ref={ref}
        id={id}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        className={`tabular-nums ${prefix ? 'pl-7' : ''} ${className ?? ''}`}
        value={text}
        onFocus={(event) => {
          // Editing "12,000.00" is easier without the separators in the way.
          setFocused(true);
          setText(value === '' || value === null || value === undefined ? '' : String(value));
          requestAnimationFrame(() => event.target.select());
        }}
        onChange={(event) => {
          const raw = toRaw(event.target.value);
          setText(raw);
          if (raw === '' || raw === '-' || raw === '.') {
            onChange('');
            return;
          }
          const parsed = Number(raw);
          if (!Number.isNaN(parsed)) onChange(parsed);
        }}
        onBlur={() => {
          setFocused(false);
          const parsed = Number(toRaw(text));
          if (text.trim() === '' || Number.isNaN(parsed)) {
            setText('');
            onChange('');
          } else {
            setText(group(parsed, decimals));
            onChange(parsed);
          }
          onBlur?.();
        }}
      />
    </div>
  );
});
