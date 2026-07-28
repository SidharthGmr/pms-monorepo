'use client';
import { SelectSearch } from '@/components/common/select-search';
import { Button } from '@/components/ui/button';
import { FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { ReceiveStockFormValues } from '@/schema/receiveStockSchema';
import { Check, Trash2 } from 'lucide-react';
import { ComponentProps, forwardRef, useEffect, useMemo, useState } from 'react';
import { Control, useFormContext, useWatch } from 'react-hook-form';

interface PurchaseItemRowProps {
  control: Control<ReceiveStockFormValues>;
  index: number;
  products: any[];
  onRemove: (index: number) => void;
  canRemove: boolean;
}

/**
 * Line items read as one table, not a stack of cards: the header band and every
 * row share this column template, so a change here moves both at once.
 */
const GRID_COLUMNS = 'sm:grid sm:grid-cols-[1.25rem_minmax(0,1fr)_5rem_7rem_6.5rem_2rem] sm:items-start sm:gap-3';

/** Column captions. Hidden on mobile, where every field carries its own label. */
export function PurchaseItemsHeader() {
  return (
    <div
      className={cn(
        'hidden border-b border-slate-200 bg-slate-50 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500',
        GRID_COLUMNS,
        'sm:items-center'
      )}
    >
      <span />
      <span>Product</span>
      <span className="text-right">Qty</span>
      <span className="text-right">Unit cost</span>
      <span className="text-right">Subtotal</span>
      <span />
    </div>
  );
}

interface NumericInputProps extends Omit<ComponentProps<typeof Input>, 'value' | 'onChange' | 'type'> {
  value: number | null | undefined;
  onValueChange: (value: number | undefined) => void;
  /** 0 = whole numbers only, 2 = allow cents. */
  decimals?: number;
}

/**
 * Number field that keeps the *typed text* as its display value.
 *
 * Binding a number straight to the input makes decimals impossible to enter:
 * `Number('100.')` is `100`, so re-rendering from the parsed value swallows the
 * separator the moment it's typed and "100.15" can never be reached. Here the raw
 * text is local state and only the parsed number is pushed to the form.
 */
const NumericInput = forwardRef<HTMLInputElement, NumericInputProps>(({ value, onValueChange, decimals = 0, onBlur, ...props }, ref) => {
  const [text, setText] = useState(() => (value === undefined || value === null ? '' : String(value)));

  // Re-sync only when the form value moves on its own — a reset, or the "Use $x.xx"
  // shortcut. Comparing the parsed text first is what lets a half-typed "100." survive.
  useEffect(() => {
    const parsed = text === '' ? undefined : Number(text);
    if (parsed !== value) {
      setText(value === undefined || value === null ? '' : String(value));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const pattern = useMemo(() => (decimals > 0 ? new RegExp(`^\\d*(\\.\\d{0,${decimals}})?$`) : /^\d*$/), [decimals]);

  const handleChange = (raw: string) => {
    // Numeric keypads on some layouts emit a comma for the decimal separator.
    const next = raw.replace(',', '.');
    // Reject the keystroke rather than silently truncating it.
    if (!pattern.test(next)) return;
    setText(next);
    onValueChange(next === '' || next === '.' ? undefined : Number(next));
  };

  return (
    <Input
      {...props}
      ref={ref}
      type="text"
      inputMode={decimals > 0 ? 'decimal' : 'numeric'}
      value={text}
      onChange={(e) => handleChange(e.target.value)}
      onBlur={(e) => {
        // Never leave the field resting on a dangling separator.
        setText((current) => (current.endsWith('.') ? current.slice(0, -1) : current));
        onBlur?.(e);
      }}
    />
  );
});
NumericInput.displayName = 'NumericInput';

export function PurchaseItemRow({ control, index, products, onRemove, canRemove }: PurchaseItemRowProps) {
  const { setValue } = useFormContext<ReceiveStockFormValues>();

  const productItems = useMemo(() => {
    return products.map((p: any) => ({
      label: p.name,
      value: p.id,
    }));
  }, [products]);

  // Live per-line subtotal (quantity × unit cost).
  const productId = useWatch({ control, name: `items.${index}.productId` });
  const quantity = useWatch({ control, name: `items.${index}.quantity` });
  const unitCost = useWatch({ control, name: `items.${index}.costPrice` });
  const lineTotal = Number(quantity) > 0 && Number(unitCost) >= 0 ? Number(quantity) * Number(unitCost) : 0;

  const selectedProduct = useMemo(() => products.find((p: any) => String(p.id) === String(productId)), [products, productId]);

  // A line is "ready" once it would actually add stock.
  const isComplete = Boolean(productId) && Number(quantity) > 0 && unitCost !== undefined && unitCost !== null && Number(unitCost) >= 0;

  const currentStock = Number(selectedProduct?.stock ?? 0);
  const incomingUnits = Number(quantity) > 0 ? Number(quantity) : 0;

  // Last known purchase cost, offered as a one-click fill so recurring restocks
  // don't have to be typed from memory.
  const lastCost = selectedProduct?.currentPrice?.costPrice ?? selectedProduct?.cost ?? null;
  const showCostHint = lastCost !== null && lastCost !== undefined && Number(lastCost) > 0 && (unitCost === undefined || unitCost === null);

  const inputClass = 'h-10 text-right tabular-nums';

  return (
    <div className={cn('group px-4 py-3 transition-colors hover:bg-slate-50/70 focus-within:bg-slate-50/70', GRID_COLUMNS)}>
      {/* Row number, replaced by a tick once the line is ready. */}
      <div className="mb-2 flex items-start justify-between sm:mb-0 sm:block sm:pt-3">
        <span className="flex h-4 items-center text-xs font-medium tabular-nums text-slate-400">
          {isComplete ? <Check className="h-4 w-4 text-primary" strokeWidth={3} /> : index + 1}
        </span>

        {/* On mobile the remove control sits up here, beside the row number. */}
        {canRemove && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 sm:hidden"
            onClick={() => onRemove(index)}
            title="Remove item"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Product */}
      <div className="min-w-0">
        <FormField
          control={control}
          name={`items.${index}.productId`}
          render={({ field }) => (
            <FormItem>
              <span className="mb-1 block text-xs font-medium text-slate-500 sm:hidden">Select a product</span>
              <FormControl>
                <SelectSearch
                  value={field.value}
                  valueType="number"
                  placeholder="Select a product"
                  items={productItems}
                  containerName={`receive-stock-product-${index}`}
                  onChange={(val) => field.onChange(val)}
                  // justify-between overrides the Button's centred layout, so the product
                  // name reads from the left like a field value instead of a caption.
                  buttonClass="h-10 w-full min-w-0 justify-between truncate px-3 text-left font-normal shadow-none"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Stock context for the chosen product. */}
        {selectedProduct && (
          <p className="mt-1.5 truncate text-xs text-slate-400">
            In stock <span className="font-medium tabular-nums text-slate-500">{currentStock}</span>
            {incomingUnits > 0 && <span className="font-medium text-primary"> → {currentStock + incomingUnits}</span>}
          </p>
        )}
      </div>

      {/* Quantity */}
      <div className="mt-3 sm:mt-0">
        <FormField
          control={control}
          name={`items.${index}.quantity`}
          render={({ field }) => (
            <FormItem>
              <span className="mb-1 block text-xs font-medium text-slate-500 sm:hidden">Qty</span>
              <FormControl>
                <NumericInput
                  name={field.name}
                  ref={field.ref}
                  onBlur={field.onBlur}
                  value={field.value}
                  onValueChange={field.onChange}
                  className={inputClass}
                  placeholder="0"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Unit cost */}
      <div className="mt-3 sm:mt-0">
        <FormField
          control={control}
          name={`items.${index}.costPrice`}
          render={({ field }) => (
            <FormItem>
              <span className="mb-1 block text-xs font-medium text-slate-500 sm:hidden">Unit cost</span>
              <FormControl>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-sm text-slate-400">$</span>
                  <NumericInput
                    name={field.name}
                    ref={field.ref}
                    onBlur={field.onBlur}
                    value={field.value}
                    onValueChange={field.onChange}
                    // Money: two decimal places, so 100.15 is accepted and 100.155 isn't.
                    decimals={2}
                    className={cn(inputClass, 'pl-6')}
                    placeholder="0.00"
                  />
                </div>
              </FormControl>
              <FormMessage />
              {showCostHint && (
                <button
                  type="button"
                  className="mt-1 block w-full text-right text-xs font-medium text-primary hover:underline"
                  onClick={() => setValue(`items.${index}.costPrice`, Number(lastCost), { shouldValidate: true, shouldDirty: true })}
                >
                  Use ${Number(lastCost).toFixed(2)}
                </button>
              )}
            </FormItem>
          )}
        />
      </div>

      {/* Subtotal */}
      <div className="mt-3 flex items-center justify-between border-t border-dashed border-slate-100 pt-3 sm:mt-0 sm:h-10 sm:justify-end sm:border-0 sm:pt-0">
        <span className="text-xs font-medium text-slate-500 sm:hidden">Subtotal</span>
        <span className={cn('text-sm font-semibold tabular-nums', lineTotal > 0 ? 'text-slate-900' : 'text-slate-300')}>${lineTotal.toFixed(2)}</span>
      </div>

      {/* Remove (desktop) — the slot is always rendered so the columns stay aligned. */}
      <div className="hidden sm:flex sm:h-10 sm:items-center sm:justify-end">
        {canRemove && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-lg text-slate-300 opacity-0 transition hover:bg-red-50 hover:text-red-500 focus-visible:opacity-100 group-hover:opacity-100"
            onClick={() => onRemove(index)}
            title="Remove item"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
