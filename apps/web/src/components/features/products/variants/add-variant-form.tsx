'use client';
import MasterEntrySelect from '@/components/common/master-entry-select';
import { SelectSearch } from '@/components/common/select-search';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import { StatusValues } from '@/enums/status-values.enum';
import { useGetAllMasterAttributes } from '@/hooks/service-hooks/useMasterEntryService';
import { useCreateProductVariant } from '@/hooks/service-hooks/useProductVariantService';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import { Plus, Tag, Trash2, TrendingUp } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';

interface AddVariantFormProps {
  productId: number;
  onDone: () => void;
  onCancel: () => void;
}

/** One "attribute = value" pair being composed. `rowId` only keys the React list. */
interface AttributeRow {
  rowId: number;
  /** Master attribute code, e.g. "SIZE" - becomes the key in the attributes JSON. */
  code: string;
  /** Master entry value, e.g. "L". */
  value: string;
}

export default function AddVariantForm({ productId, onDone, onCancel }: AddVariantFormProps) {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  const { mutateAsync: createVariant, isPending: isSaving } = useCreateProductVariant();

  // Attribute options come from master data, so adding a new "Size" later is a data
  // change in Master Entries rather than a code change here.
  const { data: attributesResponse } = useGetAllMasterAttributes({ showAllRecords: true, status: StatusValues.Published });
  const masterAttributes = useMemo(() => attributesResponse?.data?.data?.data ?? [], [attributesResponse]);

  const nextRowId = useRef(1);
  const [rows, setRows] = useState<AttributeRow[]>([{ rowId: 0, code: '', value: '' }]);

  const [sku, setSku] = useState('');
  const [stockQuantity, setStockQuantity] = useState<number | ''>('');
  const [sellingPrice, setSellingPrice] = useState<number | ''>('');
  const [costPrice, setCostPrice] = useState<number | ''>('');
  const [effectiveFrom, setEffectiveFrom] = useState('');
  const [reason, setReason] = useState('');

  const attributeItems = useMemo(
    () => masterAttributes.map((attribute) => ({ label: attribute.name, value: attribute.code })),
    [masterAttributes]
  );

  const completeRows = rows.filter((row) => row.code && row.value);

  const margin =
    sellingPrice !== '' && costPrice !== '' && Number(sellingPrice) > 0
      ? ((Number(sellingPrice) - Number(costPrice)) / Number(sellingPrice)) * 100
      : null;

  const addRow = () => setRows((prev) => [...prev, { rowId: nextRowId.current++, code: '', value: '' }]);
  const removeRow = (rowId: number) => setRows((prev) => (prev.length === 1 ? prev : prev.filter((row) => row.rowId !== rowId)));
  const patchRow = (rowId: number, patch: Partial<AttributeRow>) =>
    setRows((prev) => prev.map((row) => (row.rowId === rowId ? { ...row, ...patch } : row)));

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (completeRows.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Pick at least one attribute',
        description: 'A variant needs something to tell it apart, such as Size = L. To change a price instead, use Price History.',
      });
      return;
    }

    // Two rows sharing a key would silently collapse into one JSON entry.
    const codes = completeRows.map((row) => row.code);
    if (new Set(codes).size !== codes.length) {
      toast({ variant: 'destructive', title: 'Duplicate attribute', description: 'Each attribute can only appear once per variant.' });
      return;
    }

    if (sellingPrice === '' || Number(sellingPrice) < 0) {
      toast({ variant: 'destructive', title: 'Selling price is required', description: 'Enter zero or more.' });
      return;
    }
    if (costPrice !== '' && Number(costPrice) < 0) {
      toast({ variant: 'destructive', title: 'Cost price must be zero or greater' });
      return;
    }

    const attributes = completeRows.reduce<Record<string, string>>((acc, row) => {
      // Lower-cased key so the JSON reads { "size": "L" }, matching the schema's example.
      acc[row.code.toLowerCase()] = row.value;
      return acc;
    }, {});

    try {
      const response = await createVariant({
        productId,
        attributes,
        sellingPrice: Number(sellingPrice),
        // A sibling variant must not retire the product's other variants.
        supersedePrevious: false,
        ...(sku.trim() && { sku: sku.trim() }),
        ...(stockQuantity !== '' && { stockQuantity: Number(stockQuantity) }),
        ...(costPrice !== '' && { costPrice: Number(costPrice) }),
        ...(effectiveFrom && { effectiveFrom: new Date(effectiveFrom).toISOString() }),
        ...(reason.trim() && { reason: reason.trim() }),
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

  return (
    <Card>
      <form onSubmit={handleSubmit} className="space-y-5">
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
          <Label>Attributes *</Label>
          <div className="space-y-2">
            {rows.map((row) => (
              <div key={row.rowId} className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_auto]">
                <SelectSearch
                  items={attributeItems}
                  value={row.code}
                  valueType="string"
                  placeholder="Attribute"
                  buttonClass="w-full"
                  containerName={`variant-attribute-${row.rowId}`}
                  onChange={(value) => patchRow(row.rowId, { code: value ? String(value) : '', value: '' })}
                />
                {row.code ? (
                  <MasterEntrySelect
                    attributeCode={row.code}
                    value={row.value}
                    onChange={(value) => patchRow(row.rowId, { value: value ? String(value) : '' })}
                    buttonClass="w-full"
                    showColorSwatch
                  />
                ) : (
                  <Input disabled placeholder="Pick an attribute first" />
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-destructive"
                  disabled={rows.length === 1}
                  onClick={() => removeRow(row.rowId)}
                  title="Remove attribute"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
          <Button type="button" variant="outline" size="sm" onClick={addRow} icon={Plus} iconPlacement="left">
            Add attribute
          </Button>
          {attributeItems.length === 0 && (
            <p className="text-xs text-muted-foreground">
              No master attributes yet — create them under Master Attributes, and their values under Master Entries.
            </p>
          )}
        </div>

        {/* Identity + stock */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="variantSku">SKU</Label>
            <Input
              id="variantSku"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              placeholder="Auto-generated if left blank"
              className="font-mono"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="variantStock">Opening stock</Label>
            <Input
              id="variantStock"
              type="number"
              min="0"
              step="1"
              value={stockQuantity}
              onChange={(e) => setStockQuantity(e.target.value ? parseInt(e.target.value, 10) : '')}
              placeholder="0"
            />
          </div>
        </div>

        {/* Price */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="variantSellingPrice">Selling price *</Label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
              <Input
                id="variantSellingPrice"
                type="number"
                min="0"
                step="0.01"
                value={sellingPrice}
                onChange={(e) => setSellingPrice(e.target.value ? parseFloat(e.target.value) : '')}
                placeholder="0.00"
                className="pl-6"
                required
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="variantCostPrice">Cost price</Label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
              <Input
                id="variantCostPrice"
                type="number"
                min="0"
                step="0.01"
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value ? parseFloat(e.target.value) : '')}
                placeholder="0.00"
                className="pl-6"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="variantEffectiveFrom">Price effective from</Label>
            <Input id="variantEffectiveFrom" type="datetime-local" value={effectiveFrom} onChange={(e) => setEffectiveFrom(e.target.value)} />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="variantReason">
            Reason <span className="font-normal text-muted-foreground">(optional)</span>
          </Label>
          <Textarea
            id="variantReason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. New colourway for spring"
            rows={2}
            className="resize-none"
          />
        </div>

        <p className="text-xs text-muted-foreground">
          The price is filed in the Price History ledger for this variant, which is the source of truth — the variant&rsquo;s own price is a
          cache of it. Other variants of this product stay active. Leave &ldquo;effective from&rdquo; blank to apply the price now, or set a
          future date to stage it.
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
    </Card>
  );
}
