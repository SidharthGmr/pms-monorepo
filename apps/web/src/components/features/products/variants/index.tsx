'use client';
import ListPagination from '@/components/common/list-pagination';
import { CustomDataTable } from '@/components/Table/data-table';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import config from '@/config';
import { ProductVariantDto } from '@/dtos/product-variant.dto';
import { cn } from '@/lib/utils';
import { useGetProductById } from '@/hooks/service-hooks/useProductService';
import { useGetProductVariants } from '@/hooks/service-hooks/useProductVariantService';
import { useCustomDataTable } from '@/hooks/use-custom-table';
import { ArrowLeft, CheckCircle2, History, Layers, Pencil, Plus } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import { useProductVariantColumns } from './variant-columns';

// `p-0` alone loses to the Card's own `md:p-5` in tailwind-merge (different variant).
const FLUSH_CARD = 'p-0 md:p-0';

interface ProductVariantsProps {
  productId: number;
}

export default function ProductVariants({ productId }: ProductVariantsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isNewProduct = searchParams.get('new') === '1';

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(config.recordPerPage);

  // Add/edit live on the store-wide variant screens; the product is carried in the query.
  const openAdd = () => router.push(`/admin/product-variants/add?productId=${productId}`);
  const columns = useProductVariantColumns((variant) => router.push(`/admin/products/variants/${variant.id}?edit=1`));

  const { data: productResponse } = useGetProductById(productId);
  const listQuery = useGetProductVariants(productId, { page, recordPerPage: pageSize });

  const productName = productResponse?.data?.data?.name ?? '';
  const result = listQuery.data?.data?.data;
  const variants: ProductVariantDto[] = useMemo(() => result?.data ?? [], [result]);
  const total = result?.totalRecord ?? 0;

  const table = useCustomDataTable({
    columns,
    data: variants,
    manualFiltering: true,
    manualPagination: true,
    manualSorting: true,
    pageCount: Math.max(1, Math.ceil(total / Math.max(pageSize, 1))),
    pagination: { pageIndex: page - 1, pageSize },
    sorting: [],
  });

  const changePageSize = (size: number) => {
    setPageSize(size);
    setPage(1);
  };

  // Sellable variants are the active ones; retired rows are historical records.
  const activeVariants = variants.filter((variant) => variant.isActive);
  const hasVariants = activeVariants.length > 0;
  const showSkeleton = listQuery.isPending;

  return (
    <div className="mx-auto w-full max-w-7xl space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <Link href="/admin/products" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-3.5 w-3.5" />
            Products
          </Link>
          <div className="mt-1 flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Layers className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <h1 className="truncate text-xl font-bold tracking-tight sm:text-2xl">{productName || 'Variants'}</h1>
              <p className="text-sm text-muted-foreground">
                {listQuery.isPending
                  ? 'The sizes, colours and packs this product is sold as'
                  : `${activeVariants.length} active ${activeVariants.length === 1 ? 'variant' : 'variants'} · each one carries its own price and stock`}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {productId > 0 && (
            <Button asChild variant="outline" className="h-9 gap-1.5">
              <Link href={`/admin/products/${productId}`}>
                <Pencil className="h-4 w-4" />
                Edit product
              </Link>
            </Button>
          )}
          <Button asChild variant="outline" className="h-9 gap-1.5">
            <Link href={`/admin/product-variants/price-histories?productId=${productId}`}>
              <History className="h-4 w-4" />
              Price history
            </Link>
          </Button>
          <Button type="button" className="h-9 gap-1.5" onClick={openAdd}>
            <Plus className="h-4 w-4" />
            Add variant
          </Button>
        </div>
      </div>

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
        <ListPagination
          page={page}
          pageSize={pageSize}
          total={total}
          loading={listQuery.isFetching}
          onPageChange={setPage}
          onPageSizeChange={changePageSize}
        />
      </Card>

      {listQuery.isError ? (
        <Card className="py-16 text-center">
          <p className="text-sm font-semibold text-destructive">Could not load this product&apos;s variants</p>
          <p className="mt-1 text-xs text-muted-foreground">Check your connection and try again.</p>
        </Card>
      ) : !showSkeleton && variants.length === 0 ? (
        // An empty table says nothing about what to do next; this says it plainly.
        <Card className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
          <div className="rounded-full bg-muted p-4 text-muted-foreground">
            <Layers className="h-7 w-7" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold">No variants yet</p>
            <p className="mx-auto max-w-md text-xs text-muted-foreground">
              Add a size, colour or pack with its price and opening stock. That is what makes this product sellable.
            </p>
          </div>
          <Button type="button" className="h-9 gap-1.5" onClick={openAdd}>
            <Plus className="h-4 w-4" />
            Add the first variant
          </Button>
        </Card>
      ) : (
        <Card className={cn(FLUSH_CARD, 'overflow-hidden', listQuery.isFetching && !showSkeleton && 'opacity-60 transition-opacity')}>
          <CustomDataTable columns={columns} table={table} isLoading={showSkeleton} flush />
        </Card>
      )}

      {total > pageSize && (
        <Card size="sm">
          <ListPagination
            page={page}
            pageSize={pageSize}
            total={total}
            loading={listQuery.isFetching}
            onPageChange={setPage}
            onPageSizeChange={changePageSize}
          />
        </Card>
      )}
    </div>
  );
}
