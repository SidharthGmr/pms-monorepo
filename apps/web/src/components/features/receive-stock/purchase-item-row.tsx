'use client';
import { SelectSearch } from '@/components/common/select-search';
import { Button } from '@/components/ui/button';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { ReceiveStockFormValues } from '@/schema/receiveStockSchema';
import { Trash2 } from 'lucide-react';
import { useMemo } from 'react';
import { Control, useWatch } from 'react-hook-form';

interface PurchaseItemRowProps {
  control: Control<ReceiveStockFormValues>;
  index: number;
  products: any[];
  onRemove: (index: number) => void;
  canRemove: boolean;
}

export function PurchaseItemRow({ control, index, products, onRemove, canRemove }: PurchaseItemRowProps) {
  const productItems = useMemo(() => {
    return products.map((p: any) => ({
      label: p.name,
      value: p.id,
    }));
  }, [products]);

  // Live per-line subtotal (quantity × unit cost).
  const quantity = useWatch({ control, name: `items.${index}.quantity` });
  const unitCost = useWatch({ control, name: `items.${index}.unitCost` });
  const lineTotal = Number(quantity) > 0 && Number(unitCost) >= 0 ? Number(quantity) * Number(unitCost) : 0;

  return (
    <div className="relative flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-2 pl-6 shadow-sm transition-all duration-200 hover:border-slate-300 hover:shadow-md sm:flex-row sm:items-start">
      {/* Index Badge */}
      <div className="absolute left-2 top-4 hidden h-6 w-6 items-center justify-center rounded-full bg-slate-800 text-xs font-bold text-white shadow-sm sm:flex">
        {index + 1}
      </div>

      <div className="flex-1 w-full">
        <FormField
          control={control}
          name={`items.${index}.productId`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Product</FormLabel>
              <FormControl>
                <SelectSearch
                  value={field.value}
                  valueType="number"
                  placeholder="Select a product"
                  items={productItems}
                  onChange={(val) => field.onChange(val)}
                  buttonClass="bg-slate-50 border-slate-200 h-11 w-full font-normal shadow-sm"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="w-full sm:w-24">
        <FormField
          control={control}
          name={`items.${index}.quantity`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Quantity</FormLabel>
              <FormControl>
                <Input
                  type="text"
                  className="h-11"
                  {...field}
                  value={field.value ?? ''}
                  onChange={(e) => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
                  placeholder="0"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="w-full sm:w-28">
        <FormField
          control={control}
          name={`items.${index}.unitCost`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Unit Cost</FormLabel>
              <FormControl>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">$</span>
                  <Input
                    type="text"
                    className="h-11 pl-6"
                    {...field}
                    value={field.value ?? ''}
                    onChange={(e) => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
                    placeholder="0.00"
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Line total */}
      <div className="w-full sm:w-24">
        <FormLabel className="text-slate-400">Subtotal</FormLabel>
        <div className="flex h-11 items-center font-semibold text-slate-800">${lineTotal.toFixed(2)}</div>
      </div>

      <div className="flex w-full justify-end pt-0 sm:w-auto sm:pt-6">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={`h-11 w-11 rounded-lg text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500 ${!canRemove && 'cursor-not-allowed opacity-30 hover:bg-transparent hover:text-slate-400'}`}
          onClick={() => canRemove && onRemove(index)}
          disabled={!canRemove}
          title="Remove Item"
        >
          <Trash2 className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
