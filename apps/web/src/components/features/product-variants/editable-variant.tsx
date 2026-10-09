'use client';

import VariantPriceTable from '@/components/features/price-histories/variant-price-table';
import ConfirmBox from '@/components/common/confirm-box';
import { CurrencyInput } from '@/components/common/currency-input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import { useGetProductVariantById, useUpdateProductVariant } from '@/hooks/service-hooks/useProductVariantService';
import useUnsavedChangesWarning from '@/hooks/use-unsaved-changes-warning';
import { cn } from '@/lib/utils';
import { zodResolver } from '@/lib/zod-resolver';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import { ProductVariantListItemDto, ProductVariantUpdateRequest, updateProductVariantFields } from '@pms/types';
import { AlertTriangle, ChevronLeft, ExternalLink, History, ImageOff, Pencil, X } from 'lucide-react';
import Link from 'next/link';
import { ReactNode, useEffect, useState } from 'react';
import { Control, useForm } from 'react-hook-form';
import VariantRating from './variant-rating';

const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);

const money = (amount: number) => `₹${Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const attributesOf = (variant: ProductVariantListItemDto): { key: string; value: string }[] => {
  const attributes = variant.attributes;
  if (!attributes || typeof attributes !== 'object' || Array.isArray(attributes)) return [];
  return Object.entries(attributes).map(([key, value]) => ({ key, value: String(value) }));
};

type VariantEdits = ProductVariantUpdateRequest;

/**
 * The variant's details, edited where they are shown: pressing Edit turns each value into an
 * input in its own place, so the page never changes shape. Only the fields the update endpoint
 * accepts become editable - the rating posts through its own endpoint and the dates are stamped
 * by the API.
 */
export default function EditableVariant({ id, defaultEditing = false }: { id: number; defaultEditing?: boolean }) {
  const { data, isPending, isError } = useGetProductVariantById(id, id > 0);
  const variant = data?.data?.data as ProductVariantListItemDto | undefined;
  const updateMutation = useUpdateProductVariant();

  const [editing, setEditing] = useState(defaultEditing);
  const [activeImage, setActiveImage] = useState(0);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

  const form = useForm<VariantEdits>({
    resolver: zodResolver(updateProductVariantFields),
    defaultValues: {
      name: '',
      description: '',
      sku: '',
      barcode: '',
      sellingPrice: undefined,
      costPrice: undefined,
      stockQuantity: undefined,
      lowStockThreshold: undefined,
      isActive: true,
    },
  });

  const { isDirty } = form.formState;
  const isSaving = updateMutation.isPending;
  useUnsavedChangesWarning(editing && isDirty && !isSaving);

  // The loaded variant seeds the fields; a background refetch must not overwrite what is being typed.
  useEffect(() => {
    if (!variant || form.formState.isDirty) return;
    form.reset({
      name: variant.name ?? '',
      description: variant.description ?? '',
      sku: variant.sku,
      barcode: variant.barcode ?? '',
      sellingPrice: variant.sellingPrice ?? undefined,
      costPrice: variant.costPrice ?? undefined,
      stockQuantity: variant.stockQuantity ?? undefined,
      lowStockThreshold: variant.lowStockThreshold ?? undefined,
      isActive: variant.isActive ?? true,
    });
  }, [variant, form]);

  const stopEditing = () => {
    form.reset();
    setEditing(false);
  };

  const cancel = () => {
    if (isDirty && !isSaving) {
      setShowLeaveConfirm(true);
      return;
    }
    stopEditing();
  };

  const onSubmit = form.handleSubmit(async (model) => {
    const response = await updateMutation.mutateAsync({ id, model });

    if (response && response.status === 200) {
      toast({ variant: 'success', title: 'Variant updated successfully' });
      form.reset(model);
      setEditing(false);
    } else {
      const error = unitOfService.ErrorHandlerService.getErrorMessage(response);
      toast({ variant: 'destructive', title: 'Error', description: <span>{error}</span> });
    }
  });

  if (isPending) return <EditableVariantSkeleton />;

  if (isError || !variant) {
    return (
      <Card className="py-16 text-center">
        <AlertTriangle className="mx-auto h-7 w-7 text-destructive/70" />
        <p className="mt-3 text-sm font-semibold">{isError ? 'Could not load this variant' : 'Variant not found'}</p>
        <p className="mt-1 text-xs text-muted-foreground">{isError ? 'Check your connection and try again.' : 'It may have been removed.'}</p>
        <Button asChild variant="outline" size="sm" className="mt-5">
          <Link href="/admin/product-variants">Back to variants</Link>
        </Button>
      </Card>
    );
  }

  const images = variant.images?.length ? variant.images : variant.product?.images?.length ? variant.product.images : [];
  const stock = variant.stockQuantity ?? 0;
  const low = variant.lowStockThreshold != null && stock <= variant.lowStockThreshold;
  const live = variant.isOffer && variant.offerPrice != null;
  const payable = variant.sellingPrice == null ? null : live ? Number(variant.offerPrice) : Number(variant.sellingPrice);
  const savings = live && variant.sellingPrice ? Math.round((1 - Number(variant.offerPrice) / Number(variant.sellingPrice)) * 100) : 0;
  const attributes = attributesOf(variant);
  const active = editing ? (form.watch('isActive') ?? false) : variant.isActive;

  const date = (value?: Date | string | null, withTime = true) => (value ? unitOfService.DateTimeService.convertToLocalDate(value as Date, withTime) : '—');

  return (
    <>
      <Form {...form}>
        <form onSubmit={onSubmit} className="space-y-4">
          <Card className="!p-0 overflow-hidden">
            <div className="flex flex-col gap-3 border-b bg-muted/40 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div className="min-w-0 flex-1">
                {editing ? (
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem className="max-w-md">
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value ?? ''}
                            aria-label="Variant name"
                            className="h-auto border-0 border-b border-dashed border-primary/50 bg-transparent px-0 py-0 text-xl font-bold tracking-tight shadow-none focus-visible:ring-0 sm:text-2xl"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ) : (
                  <h1 className="truncate text-xl font-bold tracking-tight sm:text-2xl">{variant.name ?? variant.sku}</h1>
                )}

                <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
                  <span className="truncate">{variant.product?.name ?? '—'}</span>

                  {editing ? (
                    <FormField
                      control={form.control}
                      name="sku"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              {...field}
                              value={field.value ?? ''}
                              aria-label="SKU"
                              className="h-6 w-36 border-dashed border-primary/50 bg-background px-1.5 py-0 font-mono text-xs"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ) : (
                    <code className="font-mono text-xs">{variant.sku}</code>
                  )}

                  {editing ? (
                    <FormField
                      control={form.control}
                      name="isActive"
                      render={({ field }) => (
                        <FormItem className="flex items-center gap-1.5 space-y-0">
                          <FormControl>
                            <Switch checked={field.value ?? false} onCheckedChange={field.onChange} aria-label="Active" className="scale-75" />
                          </FormControl>
                          <span className={cn('text-xs font-medium', active ? 'text-emerald-700 dark:text-emerald-400' : 'text-muted-foreground')}>
                            {active ? 'Active' : 'Retired'}
                          </span>
                        </FormItem>
                      )}
                    />
                  ) : (
                    <span className={cn('inline-flex items-center gap-1.5 text-xs font-medium', active ? 'text-emerald-700 dark:text-emerald-400' : 'text-muted-foreground')}>
                      <span className={cn('h-1.5 w-1.5 rounded-full', active ? 'bg-emerald-500' : 'bg-muted-foreground/50')} />
                      {active ? 'Active' : 'Retired'}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {editing ? (
                  <>
                    <Button type="button" variant="outline" size="sm" className="h-9 gap-1.5" onClick={cancel} disabled={isSaving}>
                      <X className="h-3.5 w-3.5" />
                      Cancel
                    </Button>
                    <Button type="submit" size="sm" className="h-9 gap-1.5" loading={isSaving}>
                      Save changes
                    </Button>
                  </>
                ) : (
                  <>
                    {variant.isActive && (
                      <Button asChild type="button" variant="outline" size="sm" className="h-9 gap-1.5">
                        <a href={`/products/${encodeURIComponent(variant.sku)}`} target="_blank" rel="noreferrer">
                          <ExternalLink className="h-3.5 w-3.5" />
                          View in store
                        </a>
                      </Button>
                    )}
                    <Button type="button" size="sm" className="h-9 gap-1.5" onClick={() => setEditing(true)}>
                      <Pencil className="h-3.5 w-3.5" />
                      Edit variant
                    </Button>
                  </>
                )}
              </div>
            </div>

            <div className="grid gap-6 p-4 sm:p-6 lg:grid-cols-[320px_minmax(0,1fr)]">
              <div className="space-y-2">
                <div className="flex aspect-square items-center justify-center overflow-hidden rounded-xl border bg-muted/40">
                  {images[activeImage] ? (
                    // Variant images come from arbitrary CDNs; next/image would need each host in
                    // `next.config.mjs` remotePatterns, so a plain <img> keeps unknown hosts working.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={images[activeImage]} alt={variant.name ?? variant.sku} className="h-full w-full object-cover" />
                  ) : (
                    <ImageOff className="h-10 w-10 text-muted-foreground/30" />
                  )}
                </div>
                {images.length > 1 && (
                  <div className="flex gap-1.5 overflow-x-auto">
                    {images.map((image, index) => (
                      <button
                        key={image}
                        type="button"
                        onClick={() => setActiveImage(index)}
                        aria-label={`Photo ${index + 1}`}
                        className={cn('h-14 w-14 shrink-0 overflow-hidden rounded-lg border', index === activeImage && 'ring-2 ring-primary')}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={image} alt="" className="h-full w-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-5">
                <div className="rounded-xl border bg-muted/30 p-4">
                  {editing ? (
                    <FormField
                      control={form.control}
                      name="sellingPrice"
                      render={({ field }) => (
                        <FormItem className="max-w-[220px]">
                          <FormControl>
                            <CurrencyInput
                              value={field.value ?? ''}
                              onChange={(value) => field.onChange(value === '' ? undefined : value)}
                              className="h-12 border-dashed border-primary/50 bg-background pl-8 text-2xl font-bold"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ) : payable == null ? (
                    <p className="text-sm text-muted-foreground">Unpriced — record a price to make this sellable.</p>
                  ) : (
                    <div className="flex flex-wrap items-baseline gap-2">
                      <span className="text-3xl font-bold tabular-nums">{money(payable)}</span>
                      {live && <span className="text-sm tabular-nums text-muted-foreground line-through">{money(Number(variant.sellingPrice))}</span>}
                      {live && savings > 0 && (
                        <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">{savings}% off</span>
                      )}
                    </div>
                  )}

                  <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      Cost
                      {editing ? (
                        <FormField
                          control={form.control}
                          name="costPrice"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <CurrencyInput
                                  value={field.value ?? ''}
                                  onChange={(value) => field.onChange(value === '' ? undefined : value)}
                                  className="h-7 w-28 border-dashed border-primary/50 bg-background pl-6 text-xs"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      ) : (
                        <span className="font-semibold text-foreground">{variant.costPrice != null ? money(Number(variant.costPrice)) : '—'}</span>
                      )}
                    </span>
                    {!variant.isOffer && variant.offerPrice != null && <span>Offer {money(Number(variant.offerPrice))} staged</span>}
                  </div>
                </div>

                <dl className="grid gap-x-8 sm:grid-cols-2">
                  <Field
                    label="Stock on hand"
                    value={
                      editing ? (
                        <NumberField control={form.control} name="stockQuantity" label="Stock on hand" placeholder="0" />
                      ) : (
                        <span className="inline-flex items-center gap-1.5">
                          <span className={cn('tabular-nums', low && 'font-semibold text-amber-600 dark:text-amber-400', stock === 0 && 'text-rose-600 dark:text-rose-400')}>{stock}</span>
                          {low && (
                            <Badge variant={stock === 0 ? 'rose' : 'orange'} className="gap-1 font-normal">
                              <AlertTriangle className="h-3 w-3" />
                              {stock === 0 ? 'Out' : 'Low'}
                            </Badge>
                          )}
                        </span>
                      )
                    }
                  />
                  <Field
                    label="Low-stock alert at"
                    value={editing ? <NumberField control={form.control} name="lowStockThreshold" label="Low-stock alert at" placeholder="5" /> : (variant.lowStockThreshold ?? '—')}
                  />
                  <Field
                    label="Barcode"
                    value={
                      editing ? (
                        <FormField
                          control={form.control}
                          name="barcode"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input
                                  {...field}
                                  value={field.value ?? ''}
                                  aria-label="Barcode"
                                  placeholder="—"
                                  className="h-7 w-40 border-dashed border-primary/50 bg-background px-2 text-right font-mono text-xs"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      ) : variant.barcode ? (
                        <code className="font-mono text-xs">{variant.barcode}</code>
                      ) : (
                        '—'
                      )
                    }
                  />
                  <Field
                    label="Rating"
                    value={
                      editing ? (
                        <VariantRating variantId={variant.id} rating={variant.rating} ratingCount={variant.ratingCount} interactive size="sm" />
                      ) : variant.rating != null ? (
                        `${variant.rating.toFixed(1)} (${variant.ratingCount ?? 0})`
                      ) : (
                        'Not rated yet'
                      )
                    }
                  />
                  <Field label="Added" value={date(variant.createdAt)} />
                  <Field label="Last updated" value={date(variant.updatedAt)} />
                </dl>

                {attributes.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {attributes.map(({ key, value }) => (
                      <Badge key={key} variant="zinc" className="font-normal">
                        <span className="uppercase text-muted-foreground">{key}</span>
                        <span className="mx-1">·</span>
                        <span className="font-medium">{value}</span>
                      </Badge>
                    ))}
                  </div>
                )}

                {editing ? (
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem className="border-t pt-4">
                        <FormControl>
                          <Textarea
                            {...field}
                            value={field.value ?? ''}
                            rows={3}
                            aria-label="Description"
                            placeholder="What makes this variant distinct…"
                            className="resize-y border-dashed border-primary/50 bg-background text-sm leading-relaxed"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ) : (
                  variant.description && <p className="border-t pt-4 text-sm leading-relaxed text-muted-foreground">{variant.description}</p>
                )}
              </div>
            </div>
          </Card>
        </form>
      </Form>

      <div className="space-y-2">
        <h2 className="flex items-center gap-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          <History className="h-3.5 w-3.5 text-primary" />
          Price history
        </h2>
        <VariantPriceTable variantId={variant.id} />
      </div>

      <ConfirmBox
        isOpen={showLeaveConfirm}
        onClose={() => setShowLeaveConfirm(false)}
        onSubmit={() => {
          setShowLeaveConfirm(false);
          stopEditing();
        }}
        heading="Discard changes?"
        bodyText="This variant has unsaved changes. Closing now will lose them."
        noButtonText="Keep editing"
        yesButtonText="Discard"
      />
    </>
  );
}

export function EditableVariantBackLink() {
  return (
    <Button asChild variant="ghost" size="sm" className="-ml-2 h-8 gap-1 text-muted-foreground hover:text-foreground">
      <Link href="/admin/product-variants">
        <ChevronLeft className="h-4 w-4" />
        Back to variants
      </Link>
    </Button>
  );
}

// Whole-number field sized to sit in a detail row without changing it.
function NumberField({
  control,
  name,
  label,
  placeholder,
}: {
  control: Control<VariantEdits>;
  name: 'stockQuantity' | 'lowStockThreshold';
  label: string;
  placeholder: string;
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormControl>
            <Input
              type="number"
              min={0}
              aria-label={label}
              placeholder={placeholder}
              className="h-7 w-20 border-dashed border-primary/50 bg-background px-2 text-right tabular-nums"
              value={field.value ?? ''}
              onChange={(e) => field.onChange(e.target.value === '' ? undefined : +e.target.value)}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

function EditableVariantSkeleton() {
  return (
    <Card className="!p-0 overflow-hidden">
      <div className="border-b bg-muted/40 px-4 py-4 sm:px-6">
        <Skeleton className="h-6 w-56" />
        <Skeleton className="mt-2 h-4 w-40" />
      </div>
      <div className="grid gap-6 p-4 sm:p-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <Skeleton className="aspect-square w-full rounded-xl" />
        <div className="space-y-4">
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-40 w-full rounded-xl" />
        </div>
      </div>
    </Card>
  );
}

function Field({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-dashed py-2 last:border-0">
      <dt className="shrink-0 text-xs text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-words text-right text-sm font-medium">{value}</dd>
    </div>
  );
}
