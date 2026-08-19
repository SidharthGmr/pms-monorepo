'use client';
import { CurrencyInput } from '@/components/common/currency-input';
import { DateRangePicker } from '@/components/common/date-range-picker';
import MasterEntrySelect from '@/components/common/master-entry-select';
import { SelectSearch } from '@/components/common/select-search';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import { StatusValues } from '@/enums/status-values.enum';
import { useGetAllMasterAttributes } from '@/hooks/service-hooks/useMasterEntryService';
import { useCreateProductVariant } from '@/hooks/service-hooks/useProductVariantService';
import { getProductVariantSchema, VariantFormValues } from '@/schema/productVariantSchema';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import { yupResolver } from '@hookform/resolvers/yup';
import { Plus, Tag, Trash2, TrendingUp } from 'lucide-react';
import { useMemo } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';

interface AddVariantFormProps {
  productId: number;
  /**
   * The product has no variants yet, so this one may stand alone: a book or a bottle has
   * nothing to tell apart. Later variants must carry attributes, otherwise two rows would
   * be indistinguishable on the shelf and in the cart.
   */
  isFirstVariant?: boolean;
  onDone: () => void;
  onCancel: () => void;
}

export default function AddVariantForm({ productId, isFirstVariant = false, onDone, onCancel }: AddVariantFormProps) {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  const { mutateAsync: createVariant, isPending: isSaving } = useCreateProductVariant();

  // Attribute options come from master data, so adding a new "Size" later is a data
  // change in Master Entries rather than a code change here.
  const { data: attributesResponse } = useGetAllMasterAttributes({ showAllRecords: true, status: StatusValues.Published });
  const masterAttributes = useMemo(() => attributesResponse?.data?.data?.data ?? [], [attributesResponse]);
  const attributeItems = useMemo(() => masterAttributes.map((attribute) => ({ label: attribute.name, value: attribute.code })), [masterAttributes]);

  const schema = useMemo(() => getProductVariantSchema(isFirstVariant), [isFirstVariant]);

  const form = useForm<VariantFormValues>({
    resolver: yupResolver(schema),
    defaultValues: {
      name: '',
      sku: '',
      reason: '',
      stockQuantity: undefined,
      costPrice: undefined,
      effectiveFrom: null,
      // A first variant starts with no rows - a single-version product needs none. Every
      // later variant opens with one, because it has to differ from what is already there.
      rows: isFirstVariant ? [] : [{ code: '', value: '' }],
    },
  });

  const { control } = form;
  const { fields, append, remove } = useFieldArray({ control, name: 'rows' });

  // Watched so the margin badge and the per-row value picker react as the user types.
  const rows = form.watch('rows');
  const sellingPrice = form.watch('sellingPrice');
  const costPrice = form.watch('costPrice');

  const margin =
    sellingPrice != null && costPrice != null && Number(sellingPrice) > 0
      ? ((Number(sellingPrice) - Number(costPrice)) / Number(sellingPrice)) * 100
      : null;

  const submitData = async (model: VariantFormValues) => {
    const attributes = model.rows
      .filter((row) => row.code && row.value)
      .reduce<Record<string, string>>((acc, row) => {
        // Lower-cased key so the JSON reads { "size": "L" }, matching the schema's example.
        acc[row.code.toLowerCase()] = row.value;
        return acc;
      }, {});

    try {
      const response = await createVariant({
        productId,
        attributes,
        sellingPrice: Number(model.sellingPrice),
        // A sibling variant must not retire the product's other variants.
        supersedePrevious: false,
        ...(model.name?.trim() && { name: model.name.trim() }),
        ...(model.sku?.trim() && { sku: model.sku.trim() }),
        ...(model.stockQuantity != null && { stockQuantity: Number(model.stockQuantity) }),
        ...(model.costPrice != null && { costPrice: Number(model.costPrice) }),
        ...(model.effectiveFrom && { effectiveFrom: model.effectiveFrom.toISOString() }),
        ...(model.reason?.trim() && { reason: model.reason.trim() }),
      });

      if (response && (response.status === 200 || response.status === 201)) {
        toast({ variant: 'success', title: 'Variant added successfully' });
        onDone();
      } else {
        const error = unitOfService.ErrorHandlerService.getErrorMessage(response);
        toast({ variant: 'destructive', title: 'Could not add variant', description: <span>{error}</span> });
      }
    } catch (error: any) {
      const message = unitOfService.ErrorHandlerService.getErrorMessage(error);
      toast({ variant: 'destructive', title: 'Could not add variant', description: <span>{message || 'Unknown error occurred'}</span> });
    }
  };

  // Array-level rule failures (half-filled, duplicate, at-least-one) attach to `rows`.
  const rowsError = (form.formState.errors.rows as { message?: string } | undefined)?.message;

  return (
    <Card>
      <Form {...form}>
        <form autoComplete="off" onSubmit={form.handleSubmit(submitData)} className="space-y-5">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-sm font-medium text-foreground">
              <Tag className="h-3.5 w-3.5 text-muted-foreground" />
              New variant
            </span>
            {margin !== null && (
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                  margin >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                }`}
              >
                <TrendingUp className="h-3 w-3" />
                {margin.toFixed(1)}% margin
              </span>
            )}
          </div>

          {/* Attributes */}
          <div className="space-y-2">
            <FormLabel>
              Attributes {isFirstVariant ? <span className="font-normal text-muted-foreground">(only if it comes in variations)</span> : '*'}
            </FormLabel>
            {isFirstVariant && fields.length === 0 && (
              <p className="text-xs text-muted-foreground">
                Selling one version of this product? Leave this empty and just set the price below. If it comes in sizes, colours or packs, add an
                attribute and create one variant per combination.
              </p>
            )}
            <div className="space-y-2">
              {fields.map((fieldRow, index) => (
                <div key={fieldRow.id} className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_auto]">
                  <FormField
                    control={control}
                    name={`rows.${index}.code`}
                    render={({ field }) => (
                      <FormItem className="space-y-0">
                        <FormControl>
                          <SelectSearch
                            items={attributeItems}
                            value={field.value}
                            valueType="string"
                            placeholder="Attribute"
                            buttonClass="w-full"
                            containerName={`variant-attribute-${fieldRow.id}`}
                            onChange={(value) => {
                              field.onChange(value ? String(value) : '');
                              // A changed attribute invalidates whatever value was picked under the old one.
                              form.setValue(`rows.${index}.value`, '');
                            }}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  {rows?.[index]?.code ? (
                    <FormField
                      control={control}
                      name={`rows.${index}.value`}
                      render={({ field }) => (
                        <FormItem className="space-y-0">
                          <FormControl>
                            <MasterEntrySelect
                              attributeCode={rows[index].code}
                              value={field.value}
                              onChange={(value) => field.onChange(value ? String(value) : '')}
                              buttonClass="w-full"
                              showColorSwatch
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  ) : (
                    <Input disabled placeholder="Pick an attribute first" />
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive"
                    disabled={fields.length === 1 && !isFirstVariant}
                    onClick={() => remove(index)}
                    title="Remove attribute"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ code: '', value: '' })}
              icon={Plus}
              iconPlacement="left"
            >
              Add attribute
            </Button>
            {rowsError && <p className="text-sm font-medium text-destructive">{rowsError}</p>}
            {attributeItems.length === 0 && fields.length > 0 && (
              <p className="text-xs text-muted-foreground">
                No variant options yet — create them under Catalog Setup → Variant Options, and their values under Option Values.
              </p>
            )}
          </div>

          {/* Name */}
          <FormField
            control={control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Variant name <span className="font-normal text-muted-foreground">(optional)</span>
                </FormLabel>
                <FormControl>
                  <Input placeholder='e.g. 64GB / 4GB / 4.5" — defaults to the attribute combination' {...field} value={field.value ?? ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Identity + stock */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              control={control}
              name="sku"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>SKU</FormLabel>
                  <FormControl>
                    <Input placeholder="Auto-generated if left blank" className="font-mono" {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="stockQuantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Opening stock</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      step={1}
                      placeholder="0"
                      value={field.value ?? ''}
                      onChange={(e) => field.onChange(e.target.value === '' ? undefined : parseInt(e.target.value, 10))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Price */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <FormField
              control={control}
              name="sellingPrice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Selling price *</FormLabel>
                  <FormControl>
                    <CurrencyInput
                      id="variantSellingPrice"
                      value={field.value ?? ''}
                      onChange={(value) => field.onChange(value === '' ? undefined : value)}
                      required
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="costPrice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cost price</FormLabel>
                  <FormControl>
                    <CurrencyInput
                      id="variantCostPrice"
                      value={field.value ?? ''}
                      onChange={(value) => field.onChange(value === '' ? undefined : value)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="effectiveFrom"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price effective from</FormLabel>
                  <FormControl>
                    {/* "Effective from" is a single date; only the range's `from` is meaningful here. */}
                    <DateRangePicker
                      value={field.value ? { from: field.value } : undefined}
                      onSelect={(range) => field.onChange(range?.from ?? null)}
                      numberOfMonthsToShow={1}
                      placeholder="Apply now"
                      buttonClass="w-full"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={control}
            name="reason"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Reason <span className="font-normal text-muted-foreground">(optional)</span>
                </FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="e.g. New colourway for spring"
                    rows={2}
                    className="resize-none"
                    {...field}
                    value={field.value ?? ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <p className="text-xs text-muted-foreground">
            The price is filed in the Price History ledger for this variant, which is the source of truth — the variant&rsquo;s own price is a cache
            of it. Other variants of this product stay active. Leave &ldquo;effective from&rdquo; blank to apply the price now, or set a future date
            to stage it.
          </p>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onCancel} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="submit" loading={isSaving} icon={Plus} iconPlacement="left">
              {isSaving ? 'Saving...' : 'Save Variant'}
            </Button>
          </div>
        </form>
      </Form>
    </Card>
  );
}
