'use client';
import { SelectSearch } from '@/components/common/select-search';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/use-toast';
import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import { useCreatePriceHistory, useGetPriceHistoryById, useUpdatePriceHistory } from '@/hooks/service-hooks/usePriceHistoryService';
import { useGetAllProducts } from '@/hooks/service-hooks/useProductService';
import { useGetProductVariants } from '@/hooks/service-hooks/useProductVariantService';
import { CreatePriceHistoryModel } from '@/models/price-history.model';
import { PriceHistorySchema } from '@/schema/priceHistorySchema';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import { yupResolver } from '@hookform/resolvers/yup';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { formatPercent, marginPercent } from '../format';

interface ManagePriceHistoryProps {
  id?: number;
  /** Pre-selects the variant when adding from a filtered list. */
  defaultProductId?: number;
  defaultVariantId?: number;
  isOpen: boolean;
  onClose: (refresh: boolean) => void;
}

/** `datetime-local` wants `YYYY-MM-DDTHH:mm` in local time, not an ISO string. */
const toLocalInputValue = (value?: string | null): string => {
  if (!value) return '';
  const date = new Date(value);
  if (isNaN(date.getTime())) return '';
  const pad = (n: number) => `${n}`.padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

export default function ManagePriceHistory({ id, defaultProductId, defaultVariantId, isOpen, onClose }: ManagePriceHistoryProps) {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  const isEdit = !!id && id > 0;

  const createMutation = useCreatePriceHistory();
  const updateMutation = useUpdatePriceHistory();
  const { data: response, isLoading: isFetching } = useGetPriceHistoryById(id ?? 0, isEdit);

  // Picking a variant is a two-step choice: product first, then one of its variants.
  const [productId, setProductId] = useState<number | undefined>(defaultProductId);
  const { data: productsResponse } = useGetAllProducts({ showAllRecords: true });
  const { data: variantsResponse } = useGetProductVariants(productId ?? 0, { recordPerPage: 100 }, !!productId);

  const productItems = useMemo(
    () => (productsResponse?.data?.data?.data ?? []).map((product) => ({ label: product.name, value: product.id })),
    [productsResponse]
  );

  const variantItems = useMemo(
    () =>
      (variantsResponse?.data?.data?.data ?? []).map((variant) => ({
        label: variant.sku ? variant.sku : `Variant #${variant.id}`,
        value: variant.id,
      })),
    [variantsResponse]
  );

  const form = useForm<CreatePriceHistoryModel>({
    resolver: yupResolver(PriceHistorySchema),
    defaultValues: {
      variantId: defaultVariantId ?? 0,
      sellingPrice: 0,
      costPrice: null,
      effectiveFrom: '',
      reason: '',
    },
  });

  const existing = response?.data?.data;

  useEffect(() => {
    if (isEdit && existing) {
      // The variant cannot be moved on an existing row, so its product only matters
      // for the read-only label.
      setProductId(existing.variant?.productId);
      form.reset({
        variantId: existing.variantId,
        sellingPrice: existing.sellingPrice,
        costPrice: existing.costPrice,
        effectiveFrom: toLocalInputValue(existing.effectiveFrom),
        reason: existing.reason ?? '',
      });
    }
  }, [isEdit, existing, form]);

  const sellingPrice = form.watch('sellingPrice');
  const costPrice = form.watch('costPrice');
  const previewMargin = marginPercent(Number(sellingPrice), costPrice === null || costPrice === undefined ? null : Number(costPrice));
  const effectiveFrom = form.watch('effectiveFrom');
  const willBeScheduled = !!effectiveFrom && new Date(effectiveFrom).getTime() > Date.now();

  const submitData = async (model: CreatePriceHistoryModel) => {
    const payload = {
      ...model,
      costPrice: model.costPrice === null || model.costPrice === undefined || (model.costPrice as unknown as string) === '' ? null : +model.costPrice,
      reason: model.reason?.trim() ? model.reason.trim() : null,
      // An empty date means "now" - let the API default it rather than sending "".
      effectiveFrom: model.effectiveFrom ? new Date(model.effectiveFrom).toISOString() : null,
    };

    const result = isEdit
      ? await updateMutation.mutateAsync({
          id: id!,
          // variantId is not part of the update contract - a row cannot change variant.
          model: {
            sellingPrice: payload.sellingPrice,
            costPrice: payload.costPrice,
            effectiveFrom: payload.effectiveFrom,
            reason: payload.reason,
          },
        })
      : await createMutation.mutateAsync(payload);

    if (result && (result.status === 200 || result.status === 201)) {
      toast({ variant: 'success', title: `Price ${isEdit ? 'corrected' : 'recorded'} successfully` });
      onClose(true);
    } else {
      const error = unitOfService.ErrorHandlerService.getErrorMessage(result);
      toast({ variant: 'destructive', title: 'Error', description: <span>{error}</span> });
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending || isFetching;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose(false)}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Correct Price Row' : 'Record Price Change'}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form autoComplete="off" onSubmit={form.handleSubmit(submitData)} className="space-y-3">
            {isEdit ? (
              <div className="rounded-md border bg-muted/40 px-3 py-2">
                <span className="text-xs font-medium uppercase text-muted-foreground">Variant</span>
                <div className="flex flex-col">
                  <span className="font-medium">{existing?.variant?.product?.name || `Variant #${existing?.variantId ?? ''}`}</span>
                  {existing?.variant?.sku && <code className="font-mono text-xs text-muted-foreground">{existing.variant.sku}</code>}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormItem>
                  <FormLabel>Product *</FormLabel>
                  <FormControl>
                    <div className="flex">
                      <SelectSearch
                        placeholder="Select product"
                        buttonClass="w-full"
                        items={productItems}
                        value={productId}
                        valueType="number"
                        containerName="price-history-form-product"
                        onChange={(value) => {
                          setProductId(value === '' || value === undefined ? undefined : +value);
                          // Clear the stale variant so validation forces a fresh pick.
                          form.setValue('variantId', 0);
                        }}
                      />
                    </div>
                  </FormControl>
                  <FormDescription>Narrows the variant list.</FormDescription>
                </FormItem>

                <FormField
                  control={form.control}
                  name="variantId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Variant *</FormLabel>
                      <FormControl>
                        <div className="flex">
                          <SelectSearch
                            placeholder={productId ? 'Select variant' : 'Pick a product first'}
                            buttonClass="w-full"
                            items={variantItems}
                            value={field.value || undefined}
                            valueType="number"
                            containerName="price-history-form-variant"
                            onChange={(value) => field.onChange(+value)}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="sellingPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Selling Price *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="1099.99"
                        className="tabular-nums"
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(e.target.value === '' ? 0 : +e.target.value)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="costPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cost Price</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="800.00"
                        className="tabular-nums"
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(e.target.value === '' ? null : +e.target.value)}
                      />
                    </FormControl>
                    <FormDescription>{previewMargin !== null ? `Margin ${formatPercent(previewMargin)}` : 'Optional.'}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="effectiveFrom"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Effective From</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value)} />
                  </FormControl>
                  <FormDescription>
                    {willBeScheduled
                      ? 'Future date — the price is staged and will not be current until then.'
                      : 'Leave empty to take effect now.'}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Seasonal sale, cost increase" {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => onClose(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={isLoading}>
                {isEdit ? 'Save Correction' : 'Record Price'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
