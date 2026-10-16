'use client';
import { Input } from '@/components/ui/input';
import { forwardRef, useEffect, useRef, useState } from 'react';

interface PriceInputProps {
  /** `undefined`/`null` means the field is empty, which is different from a price of zero. */
  value: number | null | undefined;
  onChange: (value: number | undefined) => void;
  /** Width of the fraction the mask keeps in place. */
  decimals?: number;
  /** Symbol rendered inside the field. Omitted by default - pass '₹' for a rupee field. */
  prefix?: string | null;
  id?: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  onBlur?: () => void;
}

/**
 * A masked price field that always reads `0.00`. Focusing it keeps the `.00` in place and
 * selects the rupee part, so the admin types the amount straight over it; pressing `.`
 * jumps to the paise when those matter too. Clicking in and straight out again leaves the
 * field empty rather than filing a price of zero.
 *
 * `CurrencyInput` is the other money field: it shows lakh-grouped amounts (`1,20,000.00`)
 * and clears to a raw number while editing. Use this one where prices are keyed in fast,
 * one after another - variant rows, purchase lines - and that one where the amount is
 * large enough that the grouping carries meaning.
 */
export const PriceInput = forwardRef<HTMLInputElement, PriceInputProps>(function PriceInput(
  { value, onChange, decimals = 2, prefix = null, id, placeholder = '0.00', className, disabled, onBlur },
  ref
) {
  const [text, setText] = useState('');
  const [focused, setFocused] = useState(false);
  // Distinguishes a typed 0.00 from the seed the focus handler wrote.
  const typedRef = useRef(false);

  useEffect(() => {
    if (focused) return;
    setText(value == null || Number.isNaN(value) ? '' : Number(value).toFixed(decimals));
  }, [value, decimals, focused]);

  const selectRupees = (input: HTMLInputElement) => {
    const dot = input.value.indexOf('.');
    input.setSelectionRange(0, dot === -1 ? input.value.length : dot);
  };

  return (
    <div className="relative">
      {prefix && <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">{prefix}</span>}
      <Input
        ref={ref}
        id={id}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        placeholder={placeholder}
        disabled={disabled}
        className={`tabular-nums ${prefix ? 'pl-7' : ''} ${className ?? ''}`}
        value={text}
        onFocus={(event) => {
          setFocused(true);
          typedRef.current = false;
          const input = event.target;
          if (text === '') setText((0).toFixed(decimals));
          requestAnimationFrame(() => selectRupees(input));
        }}
        onKeyDown={(event) => {
          // `.` is a jump, not a character: the mask already has its dot.
          if (event.key === '.') {
            event.preventDefault();
            const input = event.currentTarget;
            const dot = input.value.indexOf('.');
            if (dot !== -1) input.setSelectionRange(dot + 1, input.value.length);
          }
        }}
        onChange={(event) => {
          typedRef.current = true;
          const raw = event.target.value.replace(/[^\d.]/g, '');
          const dot = raw.indexOf('.');
          const next = dot === -1 ? raw : raw.slice(0, dot + 1) + raw.slice(dot + 1).replace(/\./g, '').slice(0, decimals);
          setText(next);
          const parsed = Number(next);
          onChange(next === '' || next === '.' || Number.isNaN(parsed) ? undefined : parsed);
        }}
        onBlur={() => {
          setFocused(false);
          const parsed = Number(text);
          // Tabbing through the seeded 0.00 without typing is not a price of zero.
          if (text.trim() === '' || Number.isNaN(parsed) || (!typedRef.current && value == null)) {
            setText('');
            onChange(undefined);
          } else {
            setText(parsed.toFixed(decimals));
            onChange(parsed);
          }
          onBlur?.();
        }}
      />
    </div>
  );
});
