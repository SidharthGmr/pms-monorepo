'use client';
import { Input } from '@/components/ui/input';
import { forwardRef } from 'react';
import ReactCurrencyInput, { type CurrencyInputOnChangeValues } from 'react-currency-input-field';

const INTL = { locale: 'hi-IN', currency: 'INR' };

interface CurrencyInputProps {
  value: number | '' | null | undefined;
  onChange: (value: number | '') => void;
  decimals?: number;
  prefix?: string | null;
  id?: string;
  name?: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  onBlur?: () => void;
}

export const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(function CurrencyInput(
  { value, onChange, decimals = 2, prefix = '₹', id, name, placeholder = '', className, disabled, required, onBlur },
  ref
) {
  return (
    <ReactCurrencyInput
      ref={ref}
      customInput={Input}
      id={id}
      name={name}
      className={className}
      placeholder={placeholder}
      disabled={disabled}
      required={required}
      value={value ?? ''}
      decimalsLimit={decimals}
      decimalScale={decimals}
      allowNegativeValue={false}
      {...(prefix === null ? {} : { intlConfig: INTL, prefix })}
      onValueChange={(_raw?: string, _name?: string, values?: CurrencyInputOnChangeValues) =>
        onChange(typeof values?.float === 'number' && Number.isFinite(values.float) ? values.float : '')
      }
      onBlur={onBlur}
    />
  );
});
