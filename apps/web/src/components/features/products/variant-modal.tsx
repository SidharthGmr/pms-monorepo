'use client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { useEffect, useState } from 'react';
import { useGetProductVariants, useCreateProductVariant } from '@/hooks/service-hooks/useProductVariantService';
import { CustomDataTable } from '@/components/Table/data-table';
import { DataTablePagination } from '@/components/Table/data-table-pagination';
import { useProductVariantColumns } from './variants/variant-columns';
import { useTanstackTablePagination } from '@/hooks/use-tanstack-table-pagination';
import { useTanstackTableSorting } from '@/hooks/use-tanstack-table-sorting';
import { useCustomDataTable } from '@/hooks/use-custom-table';
import { ProductVariantDto } from '@/dtos/product-variant.dto';
import config from '@/config';
import { Layers, Plus, Tag, TrendingUp, Wallet, X } from 'lucide-react';

interface ProductVariantModalProps {
  productId: number;
  productName: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function ProductVariantModal({ productId, productName, isOpen, onClose }: ProductVariantModalProps) {
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

  const { data: variantResponse, isLoading, isError } = useGetProductVariants(productId, filterParams, isOpen);
  const { mutateAsync: createVariant, isPending: isSaving } = useCreateProductVariant();

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
      toast({ title: 'Success', description: 'Product variant added successfully' });
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

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-0">
          <div className="flex items-start gap-3">
            <div className="shrink-0 w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
              <Layers className="w-5 h-5 text-primary" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-base">Product Variants</DialogTitle>
              <DialogDescription className="truncate">{productName}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {isError ? (
          <div className="py-10 text-center text-red-500">Failed to load product variants.</div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              {active ? (
                <div className="rounded-md border bg-muted/40 px-4 py-2 text-sm">
                  <span className="text-muted-foreground">Currently active: </span>
                  <span className="font-medium">${Number(active.sellingPrice).toFixed(2)}</span>
                  {active.costPrice != null && <span className="text-muted-foreground"> (cost ${Number(active.costPrice).toFixed(2)})</span>}
                </div>
              ) : (
                <span className="text-sm text-muted-foreground">No active variant for this product yet.</span>
              )}

              <Button
                type="button"
                variant={showAddForm ? 'outline' : 'default'}
                icon={showAddForm ? X : Plus}
                iconPlacement="left"
                onClick={() => setShowAddForm((open) => !open)}
              >
                {showAddForm ? 'Cancel' : 'Add Variant'}
              </Button>
            </div>

            {showAddForm && (
              <form onSubmit={handleAddVariant} className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
                    <Tag className="w-3.5 h-3.5 text-slate-400" />
                    New variant
                  </span>
                  {margin !== null && (
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                        margin >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                      }`}
                    >
                      <TrendingUp className="w-3 h-3" />
                      {margin.toFixed(1)}% margin
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="variantSellingPrice" className="text-xs text-slate-500 font-normal">
                      Selling price
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 pointer-events-none">$</span>
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
                    <Label htmlFor="variantCostPrice" className="flex items-center gap-1 text-xs text-slate-500 font-normal">
                      <Wallet className="w-3 h-3" />
                      Cost price
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 pointer-events-none">$</span>
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
                    <Label htmlFor="variantEffectiveFrom" className="text-xs text-slate-500 font-normal">
                      Effective from
                    </Label>
                    <Input id="variantEffectiveFrom" type="datetime-local" value={effectiveFrom} onChange={(e) => setEffectiveFrom(e.target.value)} />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="variantReason" className="text-xs text-slate-500 font-normal">
                    Reason <span className="text-slate-400">(optional)</span>
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

                <p className="text-xs text-slate-400">
                  Adding a variant creates a new active price. The previous active variant is superseded automatically. Leave &ldquo;effective
                  from&rdquo; blank to apply it immediately.
                </p>

                <div className="flex justify-end">
                  <Button type="submit" loading={isSaving} icon={Plus} iconPlacement="left">
                    {isSaving ? 'Saving...' : 'Save Variant'}
                  </Button>
                </div>
              </form>
            )}

            <div className="rounded-md border bg-white shadow-sm overflow-hidden">
              <CustomDataTable columns={columns} table={table} isLoading={isLoading} />
            </div>
            <div className="py-2">
              <DataTablePagination table={table} totalRecord={recordCount} loading={isLoading} />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
