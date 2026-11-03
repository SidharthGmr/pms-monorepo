'use client';
import { CurrencyInput } from '@/components/common/currency-input';
import { DateRangePicker } from '@/components/common/date-range-picker';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import ManagePriceHistorySkeleton from '@/components/skelton/managePriceHistory-Skeleton';
import { toast } from '@/components/ui/use-toast';
import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import {
  useCreatePriceHistory,
  useGetPriceHistoryById,
  useGetPriceHistoryByVariant,
  useUpdatePriceHistory,
} from '@/hooks/service-hooks/usePriceHistoryService';
import { useGetAllProducts } from '@/hooks/service-hooks/useProductService';
import { useGetProductVariants } from '@/hooks/service-hooks/useProductVariantService';

import { PriceHistoryDto, priceHistoryFormFields } from '@pms/types';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import { cn } from '@/lib/utils';
import { zodResolver } from '@/lib/zod-resolver';
import { TrendingDown, TrendingUp } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useForm, Resolver } from 'react-hook-form';
import { formatPercent, formatPrice, isScheduled, marginPercent } from '../format';
import { CreatePriceHistoryModel } from '@pms/types';

interface ManagePriceHistoryProps {
  id?: number;
  defaultProductId?: number;
  defaultVariantId?: number;
  isOpen: boolean;
  onClose: (refresh: boolean) => void;
}

/** The date boxes hand back a `Date`; everything else in the form carries `null` for "not set". */
const toDateValue = (value?: Date | string | null): Date | undefined => {
  if (!value) return undefined;
  const date = new Date(value);
  return isNaN(date.getTime()) ? undefined : date;
};

/** A currency box reports `''` when cleared, which the model spells `null`. */
const toPriceValue = (value: number | '' | null | undefined): number | null =>
  value === '' || value === null || value === undefined ? null : Number(value);

export default function ManagePriceHistory({ id, defaultProductId, defaultVariantId, isOpen, onClose }: ManagePriceHistoryProps) {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  const isEdit = !!id && id > 0;

  const createMutation = useCreatePriceHistory();
  const updateMutation = useUpdatePriceHistory();
  const { data: response, isLoading: isFetching } = useGetPriceHistoryById(id ?? 0, isEdit);

  const [productId, setProductId] = useState<number | undefined>(defaultProductId);
  const { data: productsResponse } = useGetAllProducts({ showAllRecords: true });
  const { data: variantsResponse } = useGetProductVariants(productId ?? 0, { recordPerPage: 100 }, !!productId);

  const productName = useMemo(
    () => (productsResponse?.data?.data?.data ?? []).find((product) => product.id === productId)?.name,
    [productsResponse, productId]
  );

  const variants = useMemo(() => variantsResponse?.data?.data?.data ?? [], [variantsResponse]);
  const form = useForm<CreatePriceHistoryModel>({
    resolver: zodResolver(priceHistoryFormFields) as Resolver<CreatePriceHistoryModel>,
    defaultValues: {
      variantId: defaultVariantId ?? 0,
      sellingPrice: 0,
      offerPrice: null,
      costPrice: null,
      effectiveFrom: null,
      effectiveTo: null,
      reason: '',
    },
  });

  const existing = response?.data?.data;

  // The ledger of whichever variant the form has selected (the pre-selected one on open);
  // the hook stays disabled while no variant is chosen.
  const watchedVariantId = form.watch('variantId');
  const { data: variantHistoryResponse } = useGetPriceHistoryByVariant(watchedVariantId || 0);
  const variantPriceHistory: PriceHistoryDto[] = variantHistoryResponse?.data?.data?.data ?? [];
  // The row in force: a single element reference, stable across renders because it comes
  // out of the cached query data.
  const currentLedgerRow = variantPriceHistory.find((row) => row.isCurrent) ?? variantPriceHistory[0];

  useEffect(() => {
    if (isEdit && existing) {
      setProductId(existing.variant?.productId);
      form.reset({
        variantId: existing.variantId,
        sellingPrice: existing.sellingPrice,
        offerPrice: existing.offerPrice,
        costPrice: existing.costPrice,
        effectiveFrom: toDateValue(existing.effectiveFrom) ?? null,
        effectiveTo: toDateValue(existing.effectiveTo) ?? null,
        reason: existing.reason ?? '',
      });
    }
  }, [isEdit, existing, form]);

  const selectedVariant = variants.find((variant) => variant.id === watchedVariantId);

  // Adding: start from the prices in force so the user edits the numbers instead of retyping
  // them. The ledger row is the authority, the variant row fills the gaps (a cost the ledger
  // never recorded, or a variant with no ledger yet). Never clobber a form the user touched.
  useEffect(() => {
    if (!isEdit && !form.formState.isDirty && (currentLedgerRow || selectedVariant)) {
      form.reset({
        variantId: currentLedgerRow?.variantId ?? selectedVariant!.id,
        sellingPrice: currentLedgerRow?.sellingPrice ?? selectedVariant?.sellingPrice ?? 0,
        offerPrice: currentLedgerRow?.offerPrice ?? selectedVariant?.offerPrice ?? null,
        costPrice: currentLedgerRow?.costPrice ?? selectedVariant?.costPrice ?? null,
        // A new row opens its own period: the dates start blank rather than inheriting
        // the window of the row it supersedes.
        effectiveFrom: null,
        effectiveTo: null,
        reason: '',
      });
    }
  }, [isEdit, currentLedgerRow, selectedVariant, form]);

  const sellingPrice = form.watch('sellingPrice');
  const costPrice = form.watch('costPrice');
  const offerPrice = form.watch('offerPrice');
  const effectiveFrom = form.watch('effectiveFrom');
  const effectiveTo = form.watch('effectiveTo');

  // A row dated in the future is staged: it is recorded now but does not become the price
  // in force until that date.
  const willBeScheduled = isScheduled(effectiveFrom);
  const variantLabel = isEdit
    ? (existing?.variant?.product?.name ?? `Variant #${existing?.variantId ?? ''}`)
    : (productName ?? selectedVariant?.name ?? `Variant #${watchedVariantId || ''}`);
  const variantSku = isEdit ? existing?.variant?.sku : selectedVariant?.sku;
  // What the customer is actually charged while this row is in force - the offer when there
  // is one, otherwise the selling price. That is also what the margin has to be read against.
  const payablePrice = toPriceValue(offerPrice as number | '' | null | undefined) ?? Number(sellingPrice);
  const margin = marginPercent(payablePrice, toPriceValue(costPrice as number | '' | null | undefined));
  // The ledger is the authority on the price in force; the variant row covers the moment the
  // ledger for a freshly picked variant is still loading. The id check keeps a stale cached
  // ledger from leaking across a variant switch.
  const ledgerPrice = currentLedgerRow && currentLedgerRow.variantId === watchedVariantId ? currentLedgerRow.sellingPrice : null;
  const currentPrice = isEdit ? (existing?.previousPrice ?? null) : (ledgerPrice ?? selectedVariant?.sellingPrice ?? null);
  const newPrice = Number(sellingPrice);
  const priceDelta = currentPrice ? ((newPrice - currentPrice) / currentPrice) * 100 : null;
  const showDelta = currentPrice !== null && Number.isFinite(newPrice) && newPrice > 0 && newPrice !== currentPrice;

  const submitData = async (model: CreatePriceHistoryModel) => {
    const payload = {
      ...model,
      offerPrice: toPriceValue(model.offerPrice as number | '' | null | undefined),
      costPrice: toPriceValue(model.costPrice as number | '' | null | undefined),
      reason: model.reason?.trim() ? model.reason.trim() : null,
      // An empty date means "now" (and "no end") - let the API default it rather than sending "".
      effectiveFrom: model.effectiveFrom ? new Date(model.effectiveFrom).toISOString() : null,
      effectiveTo: model.effectiveTo ? new Date(model.effectiveTo).toISOString() : null,
    };

    const result = isEdit
      ? await updateMutation.mutateAsync({
          id: id!,
          // variantId is not part of the update contract - a row cannot change variant.
          model: {
            sellingPrice: payload.sellingPrice,
            offerPrice: payload.offerPrice,
            costPrice: payload.costPrice,
            effectiveFrom: payload.effectiveFrom,
            effectiveTo: payload.effectiveTo,
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
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Correct Price Row' : 'Record Price Change'}</DialogTitle>
          <DialogDescription className="text-xs">
            {isEdit
              ? 'Fixes a mistake on this ledger row — it does not record a new price change.'
              : 'Adds a new row to the variant’s price ledger and supersedes the one in force.'}
          </DialogDescription>
        </DialogHeader>

        {isEdit && isFetching ? (
          <ManagePriceHistorySkeleton />
        ) : (
          <Form {...form}>
            <form autoComplete="off" onSubmit={form.handleSubmit(submitData)} className="space-y-3">
              <div className="rounded-md border bg-muted/40 px-3 py-2">
                <span className="text-xs font-medium uppercase text-muted-foreground">Variant</span>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium">{variantLabel}</span>
                  {variantSku && <code className="font-mono text-xs text-muted-foreground">{variantSku}</code>}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <FormField
                  control={form.control}
                  name="costPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cost Price</FormLabel>
                      <FormControl>
                        <CurrencyInput
                          placeholder="800.00"
                          value={field.value ?? ''}
                          onChange={(value) => field.onChange(value === '' ? null : value)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="sellingPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Selling Price *</FormLabel>
                      <FormControl>
                        <CurrencyInput
                          placeholder="1,099.99"
                          value={field.value ?? ''}
                          onChange={(value) => field.onChange(value === '' ? 0 : value)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="offerPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Offer Price</FormLabel>
                      <FormControl>
                        <CurrencyInput
                          placeholder="No offer"
                          value={field.value ?? ''}
                          onChange={(value) => field.onChange(value === '' ? null : value)}
                        />
                      </FormControl>
                      <FormDescription className="text-[11px]">Charged instead of the selling price while the offer is on.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {(showDelta || margin !== null) && (
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border bg-muted/40 px-3 py-2 text-sm">
                  {showDelta ? (
                    <span className="text-muted-foreground">
                      {formatPrice(currentPrice)} <span className="mx-1 text-muted-foreground/60">→</span>
                      <span className="font-semibold text-foreground">{formatPrice(newPrice)}</span>
                    </span>
                  ) : (
                    <span className="text-muted-foreground">{formatPrice(payablePrice)} payable</span>
                  )}
                  <span className="flex items-center gap-2">
                    {margin !== null && (
                      <span
                        className={cn(
                          'rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular-nums',
                          margin >= 0 ? 'bg-muted text-muted-foreground' : 'bg-rose-500/15 text-rose-700 dark:text-rose-400'
                        )}
                      >
                        {formatPercent(margin)} margin
                      </span>
                    )}
                    {showDelta && (
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular-nums',
                          priceDelta! > 0
                            ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                            : 'bg-rose-500/15 text-rose-700 dark:text-rose-400'
                        )}
                      >
                        {priceDelta! > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        {formatPercent(Math.abs(priceDelta!))}
                      </span>
                    )}
                  </span>
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="effectiveFrom"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Effective From</FormLabel>
                      <FormControl>
                        <DateRangePicker
                          value={toDateValue(field.value) ? { from: toDateValue(field.value) } : undefined}
                          onSelect={(range) => field.onChange(range?.from ?? null)}
                          numberOfMonthsToShow={1}
                          placeholder="Immediately"
                          buttonClass="w-full"
                        />
                      </FormControl>
                      <FormDescription className="text-[11px]">
                        {willBeScheduled ? 'Future date — the price is staged and is not current until then.' : 'Leave empty to take effect now.'}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="effectiveTo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Effective To</FormLabel>
                      <FormControl>
                        <DateRangePicker
                          value={toDateValue(field.value) ? { from: toDateValue(field.value) } : undefined}
                          onSelect={(range) => field.onChange(range?.from ?? null)}
                          numberOfMonthsToShow={1}
                          placeholder="No end date"
                          buttonClass="w-full"
                        />
                      </FormControl>
                      <FormDescription className="text-[11px]">Leave empty to run until the next price change.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {/* Closing the period ends the price itself, not just the offer. */}
                {effectiveTo && (
                  <p className="text-[11px] text-amber-700 dark:text-amber-400 sm:col-span-2">
                    After this date the variant has no price in force and cannot be bought until a later row starts.
                  </p>
                )}
              </div>

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
        )}
      </DialogContent>
    </Dialog>
  );
}
