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
import { History, Plus, X } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useProductVariantColumns } from '../variant-columns';
import AddVariantForm from './add-variant-form';

interface ProductVariantsProps {
  productId: number;
}

export default function ProductVariants({ productId }: ProductVariantsProps) {
  const [data, setData] = useState<ProductVariantDto[]>([]);
  const [recordCount, setRecordCount] = useState<number>(0);
  const [showAddForm, setShowAddForm] = useState(false);

  const [filterParams, setFilterParams] = useState({
    page: 1,
    recordPerPage: config.recordPerPage,
  });

  const columns = useProductVariantColumns();

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

  return (
    <div className="space-y-4">
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
            <Button
              type="button"
              variant={showAddForm ? 'outline' : 'default'}
              icon={showAddForm ? X : Plus}
              iconPlacement="left"
              onClick={() => setShowAddForm((open) => !open)}
              className="flex-1 sm:flex-initial"
            >
              {showAddForm ? 'Cancel' : 'Add Variant'}
            </Button>
          </div>
        </div>
      </Card>

      {showAddForm && <AddVariantForm productId={productId} onDone={() => setShowAddForm(false)} onCancel={() => setShowAddForm(false)} />}

      <Card className="overflow-hidden p-0">
        <CustomDataTable columns={columns} table={table} isLoading={isLoading} />
      </Card>

      <DataTablePagination table={table} totalRecord={recordCount} loading={isLoading} />
    </div>
  );
}
