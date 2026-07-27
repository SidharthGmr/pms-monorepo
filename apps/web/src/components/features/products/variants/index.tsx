'use client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { useEffect, useState } from 'react';
import { useGetProductVariants, useCreateProductVariant } from '@/hooks/service-hooks/useProductVariantService';
import { useGetProductById } from '@/hooks/service-hooks/useProductService';
import { CustomDataTable } from '@/components/Table/data-table';
import { DataTablePagination } from '@/components/Table/data-table-pagination';
import { useProductVariantColumns } from '../variant-columns';
import { useTanstackTablePagination } from '@/hooks/use-tanstack-table-pagination';
import { useTanstackTableSorting } from '@/hooks/use-tanstack-table-sorting';
import { useCustomDataTable } from '@/hooks/use-custom-table';
import { ProductVariantDto } from '@/dtos/product-variant.dto';
import config from '@/config';
import { Plus, Tag, TrendingUp, Wallet, X } from 'lucide-react';

interface ProductVariantsProps {
  productId: number;
}

export default function ProductVariants({ productId }: ProductVariantsProps) {
  const [data, setData] = useState<ProductVariantDto[]>([]);
  const [recordCount, setRecordCount] = useState<number>(0);
  const [showAddForm, setShowAddForm] = useState(false);

  const [sellingPrice, setSellingPrice] = useState<number | ''>('');
  const [costPrice, setCostPrice] = useState<number | ''>('');
  const [effectiveFrom, setEffectiveFrom] = useState<string>('');
  const [reason, setReason] = useState<string>('');

  const { toast } = useToast();

  const [filterParams, setFilterParams] = useState({
    page: 1,
    recordPerPage: config.recordPerPage,
  });

  const columns = useProductVariantColumns();

  const { data: productResponse } = useGetProductById(productId, productId > 0);
  const { data: variantResponse, isLoading, isError } = useGetProductVariants(productId, filterParams);
  const { mutateAsync: createVariant, isPending: isSaving } = useCreateProductVariant();

  const productName = productResponse?.data?.data?.name ?? '';

  useEffect(() => {
    if (variantResponse?.data?.data) {
      setData(variantResponse.data.data.data ?? []);
      setRecordCount(variantResponse.data.data.totalRecord ?? 0);
    }
  }, [variantResponse]);

  const { sorting, onSortingChange } = useTanstackTableSorting<ProductVariantDto>('effectiveFrom', 'desc', columns);
  const { onPaginationChange, pagination } = useTanstackTablePagination(filterParams.recordPerPage);

  const table = useCustomDataTable({
    columns,
    data,
    manualFiltering: true,
    manualPagination: true,
    manualSorting: true,
    pageCount: Math.ceil((recordCount || 0) / (filterParams.recordPerPage || 1)),
    pagination,
    sorting,
    onPaginationChange,
    onSortingChange,
  });

  useEffect(() => {
    setFilterParams((prev) => ({
      ...prev,
      page: pagination.pageIndex + 1,
      recordPerPage: pagination.pageSize,
    }));
  }, [pagination]);

  const active = data.find((variant) => variant.isActive);

  // Live profit margin preview when both prices are entered.
  const margin =
    sellingPrice !== '' && costPrice !== '' && Number(sellingPrice) > 0
      ? ((Number(sellingPrice) - Number(costPrice)) / Number(sellingPrice)) * 100
      : null;

  const resetForm = () => {
    setSellingPrice('');
    setCostPrice('');
    setEffectiveFrom('');
    setReason('');
  };

  const handleAddVariant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sellingPrice === '' || Number(sellingPrice) < 0) {
      toast({ title: 'Error', description: 'Selling price is required and must be zero or greater', variant: 'destructive' });
      return;
    }
    if (costPrice !== '' && Number(costPrice) < 0) {
      toast({ title: 'Error', description: 'Cost price must be zero or greater', variant: 'destructive' });
      return;
    }

    try {
      await createVariant({
        productId,
        sellingPrice: Number(sellingPrice),
        ...(costPrice !== '' && { costPrice: Number(costPrice) }),
        ...(effectiveFrom && { effectiveFrom: new Date(effectiveFrom).toISOString() }),
        ...(reason && { reason }),
      });
      toast({ variant: 'success', title: 'Product variant added successfully' });
      resetForm();
      setShowAddForm(false);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.response?.data?.message || 'Failed to add product variant',
        variant: 'destructive',
      });
    }
  };

  if (isError) {
    return (
      <Card>
        <div className="py-10 text-center text-destructive">Failed to load product variants.</div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card size="sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {active ? (
            <div className="text-sm">
              <span className="text-muted-foreground">Currently active: </span>
              <span className="font-semibold">${Number(active.sellingPrice).toFixed(2)}</span>
              {active.costPrice != null && (
                <span className="text-muted-foreground"> (cost ${Number(active.costPrice).toFixed(2)})</span>
              )}
              {productName && <span className="ml-2 text-muted-foreground">· {productName}</span>}
            </div>
          ) : (
            <span className="text-sm text-muted-foreground">
              No active variant for this product yet.
            </span>
          )}

          <Button
            type="button"
            variant={showAddForm ? 'outline' : 'default'}
            icon={showAddForm ? X : Plus}
            iconPlacement="left"
            onClick={() => setShowAddForm((open) => !open)}
            className="w-full sm:w-auto"
          >
            {showAddForm ? 'Cancel' : 'Add Variant'}
          </Button>
        </div>
      </Card>

      {showAddForm && (
        <Card>
          <form onSubmit={handleAddVariant} className="space-y-4">
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
                    autoFocus
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="variantCostPrice" className="flex items-center gap-1">
                  <Wallet className="h-3 w-3" />
                  Cost price
                </Label>
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
                <Label htmlFor="variantEffectiveFrom">Effective from</Label>
                <Input
                  id="variantEffectiveFrom"
                  type="datetime-local"
                  value={effectiveFrom}
                  onChange={(e) => setEffectiveFrom(e.target.value)}
                />
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
                placeholder="e.g. Seasonal price update, Supplier cost change"
                rows={2}
                className="resize-none"
              />
            </div>

            <p className="text-xs text-muted-foreground">
              Adding a variant creates a new active price. The previous active variant is superseded automatically. Leave
              &ldquo;effective from&rdquo; blank to apply it immediately.
            </p>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowAddForm(false)} disabled={isSaving}>
                Cancel
              </Button>
              <Button type="submit" loading={isSaving} icon={Plus} iconPlacement="left">
                {isSaving ? 'Saving...' : 'Save Variant'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      <Card className="p-0 overflow-hidden">
        <CustomDataTable columns={columns} table={table} isLoading={isLoading} />
      </Card>

      <DataTablePagination table={table} totalRecord={recordCount} loading={isLoading} />
    </div>
  );
}
