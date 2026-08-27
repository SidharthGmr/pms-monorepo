'use client';
import { CustomDataTable } from '@/components/Table/data-table';
import { DataTablePagination } from '@/components/Table/data-table-pagination';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import config from '@/config';
import { ProductVariantDto } from '@/dtos/product-variant.dto';
import { useGetProductById } from '@/hooks/service-hooks/useProductService';
import { useGetProductVariants } from '@/hooks/service-hooks/useProductVariantService';
import { useCustomDataTable } from '@/hooks/use-custom-table';
import { useTanstackTablePagination } from '@/hooks/use-tanstack-table-pagination';
import { useTanstackTableSorting } from '@/hooks/use-tanstack-table-sorting';
import { CheckCircle2, History, Layers, Plus } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useProductVariantColumns } from '../variant-columns';

interface ProductVariantsProps {
  productId: number;
}

export default function ProductVariants({ productId }: ProductVariantsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isNewProduct = searchParams.get('new') === '1';

  const [data, setData] = useState<ProductVariantDto[]>([]);
  const [recordCount, setRecordCount] = useState<number>(0);

  const [filterParams, setFilterParams] = useState({
    page: 1,
    recordPerPage: config.recordPerPage,
  });

  // Add/edit live on their own pages (like Products), not in a dialog.
  // Add/edit live on the store-wide variant screens; the product is carried in the query.
  const openAdd = () => router.push(`/admin/product-variants/add?productId=${productId}`);
  const columns = useProductVariantColumns((variant) => router.push(`/admin/product-variants/${variant.id}`));

  const { data: productResponse } = useGetProductById(productId, productId > 0);
  const { data: variantResponse, isLoading, isError } = useGetProductVariants(productId, filterParams);

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

  // Sellable variants are the active ones; superseded rows are historical price records.
  const activeVariants = data.filter((variant) => variant.isActive);

  if (isError) {
    return (
      <Card>
        <div className="py-10 text-center text-destructive">Failed to load product variants.</div>
      </Card>
    );
  }

  const hasVariants = activeVariants.length > 0;

  return (
    <div className="space-y-4">
      {isNewProduct && (
        <Card size="sm" className="border-primary/40 bg-primary/5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              {hasVariants ? (
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
              ) : (
                <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
                  2
                </span>
              )}
              <div className="text-sm">
                <p className="font-semibold">{hasVariants ? 'This product can now be sold' : 'Step 2 of 2 — add the first variant'}</p>
                <p className="text-muted-foreground">
                  {hasVariants
                    ? 'Add more sizes or colours now, or finish and come back later.'
                    : 'A product needs one variant with a price before it can be added to a cart or sold.'}
                </p>
              </div>
            </div>
            {hasVariants && (
              <Button asChild variant="outline" className="shrink-0">
                <Link href="/admin/products">Done</Link>
              </Button>
            )}
          </div>
        </Card>
      )}

      <Card size="sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm">
            <span className="font-semibold">{activeVariants.length}</span>
            <span className="text-muted-foreground"> active variant{activeVariants.length === 1 ? '' : 's'}</span>
            {productName && <span className="text-muted-foreground"> · {productName}</span>}
          </div>

          <div className="flex w-full gap-2 sm:w-auto">
            {/* Price changes belong on the ledger screen, not on this form. */}
            <Button asChild variant="outline" className="flex-1 sm:flex-initial">
              <Link href={`/admin/price-histories?productId=${productId}`}>
                <History className="mr-2 h-4 w-4" />
                Price History
              </Link>
            </Button>
            <Button type="button" icon={Plus} iconPlacement="left" onClick={openAdd} className="flex-1 sm:flex-initial">
              Add Variant
            </Button>
          </div>
        </div>
      </Card>

      {!isLoading && data.length === 0 ? (
        // An empty table says nothing about what to do next; this says it plainly.
        <Card>
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <span className="rounded-full bg-primary/10 p-3 text-primary">
              <Layers className="h-5 w-5" />
            </span>
            <div className="space-y-1">
              <p className="font-medium">No variants yet</p>
              <p className="mx-auto max-w-md text-sm text-muted-foreground">
                Add a size, colour or pack with its price and opening stock. That is what makes this product sellable.
              </p>
            </div>
            <Button type="button" icon={Plus} iconPlacement="left" onClick={openAdd}>
              Add the first variant
            </Button>
          </div>
        </Card>
      ) : (
        <>
          <Card className="overflow-hidden p-0">
            <CustomDataTable columns={columns} table={table} isLoading={isLoading} />
          </Card>

          <DataTablePagination table={table} totalRecord={recordCount} loading={isLoading} />
        </>
      )}
    </div>
  );
}
