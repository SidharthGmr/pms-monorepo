'use client';
import { SelectSearch } from '@/components/common/select-search';
import { Button } from '@/components/ui/button';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { ReceiveStockFormValues } from '@/schema/receiveStockSchema';
import { Trash2 } from 'lucide-react';
import { useMemo } from 'react';
import { Control } from 'react-hook-form';

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
      value: p.id
    }));
  }, [products]);

  return (
    <div className="flex flex-col sm:flex-row items-start gap-4 p-4 bg-white shadow-lg hover:shadow-md hover:border-slate-300 transition-all duration-200 relative group">

      {/* Decorative Index Badge */}
      <div className="hidden sm:flex absolute -left-0 -top-0 w-4 h-4 bg-slate-800 text-white rounded-full items-center justify-center text-xs font-bold shadow-sm">
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

      <div className="w-full sm:w-28">
        <FormField
          control={control}
          name={`items.${index}.quantity`}
          render={({ field }) => (
            <FormItem>
              <FormLabel >Quantity</FormLabel>
              <FormControl>
                <Input
                  type="text"
                  className=""
                  {...field}
                  onChange={(e) => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
                  placeholder="0"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="w-full sm:w-32">
        <FormField
          control={control}
          name={`items.${index}.unitCost`}
          render={({ field }) => (
            <FormItem>
              <FormLabel >Unit Cost ($)</FormLabel>
              <FormControl>
                <Input
                  type="text"
                  className=""
                  {...field}
                  onChange={(e) => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
                  placeholder="0.00"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="w-full sm:w-auto flex justify-end pt-6">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={`h-11 w-11 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors ${!canRemove && 'opacity-30 cursor-not-allowed hover:bg-transparent hover:text-slate-400'}`}
          onClick={() => canRemove && onRemove(index)}
          disabled={!canRemove}
          title="Remove Item"
        >
          <Trash2 className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}
