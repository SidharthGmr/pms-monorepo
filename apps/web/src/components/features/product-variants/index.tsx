'use client';
import { CustomDataTable } from '@/components/Table/data-table';
import { DataTablePagination } from '@/components/Table/data-table-pagination';
import config from '@/config';
import { ProductVariantListItemDto } from '@/dtos/product-variant.dto';
import { useGetAllProductVariants } from '@/hooks/service-hooks/useProductVariantService';
import { useCustomDataTable } from '@/hooks/use-custom-table';
import { useTanstackTablePagination } from '@/hooks/use-tanstack-table-pagination';
import { useTanstackTableSorting } from '@/hooks/use-tanstack-table-sorting';
import { ProductVariantFilterParams } from '@/params/product-variant.params';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useProductVariantColumns } from './columns';
import ProductVariantFilter from './filter';

export default function ProductVariantList() {
  const searchParams = useSearchParams();
  // A product screen can deep-link here with ?productId=
  const initialProductId = searchParams.get('productId') ? +searchParams.get('productId')! : undefined;

  const [data, setData] = useState<ProductVariantListItemDto[]>([]);
  const [recordCount, setRecordCount] = useState<number>(0);

  const [filterParams, setFilterParams] = useState<ProductVariantFilterParams>({
    search: searchParams.get('search') || '',
    productId: initialProductId,
    page: +(searchParams.get('page') || 1),
    recordPerPage: +(searchParams.get('recordPerPage') || config.recordPerPage),
    // Price and stock are derived rather than stored, so the sortable columns are the
    // variant's own: SKU, name, created date and id.
    sortBy: searchParams.get('sortBy') || 'createdAt',
    sortDirection: searchParams.get('sortDirection') || 'DESC',
  });

  const listResponse = useGetAllProductVariants(filterParams);
  const columns = useProductVariantColumns();

  useEffect(() => {
    if (listResponse.status === 'success' && listResponse.data?.data?.data) {
      const result = listResponse.data.data.data;
      setData(result.data ?? []);
      setRecordCount(result.totalRecord ?? 0);
    }
  }, [listResponse.status, listResponse.data]);

  const { sorting, onSortingChange } = useTanstackTableSorting<ProductVariantListItemDto>(
    filterParams.sortBy ?? 'createdAt',
    filterParams.sortDirection ?? 'DESC',
    columns
  );
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
    setFilterParams((prev) => ({ ...prev, page: pagination.pageIndex + 1, recordPerPage: pagination.pageSize }));
  }, [pagination]);

  useEffect(() => {
    setFilterParams((prev) => ({
      ...prev,
      sortBy: sorting?.[0]?.id ?? 'createdAt',
      sortDirection: sorting?.[0]?.desc === false ? 'ASC' : 'DESC',
      page: 1,
    }));
  }, [sorting]);

  const resetForm = () => {
    setFilterParams({
      search: '',
      productId: undefined,
      categoryId: undefined,
      isActive: undefined,
      page: 1,
      recordPerPage: config.recordPerPage,
      sortBy: 'createdAt',
      sortDirection: 'DESC',
    });
  };

  if (listResponse.isError) {
    return <div className="py-10 text-center text-destructive">Error loading product variants</div>;
  }

  return (
    <div className="space-y-4">
      <ProductVariantFilter
        table={table}
        initialProductId={initialProductId}
        resetForm={resetForm}
        onTextChange={(value) => setFilterParams((prev) => ({ ...prev, search: value || '', page: 1 }))}
        onProductChange={(productId) => setFilterParams((prev) => ({ ...prev, productId, page: 1 }))}
        onCategoryChange={(categoryId) => setFilterParams((prev) => ({ ...prev, categoryId, page: 1 }))}
        onActiveChange={(isActive) => setFilterParams((prev) => ({ ...prev, isActive, page: 1 }))}
      />
      <CustomDataTable columns={columns} table={table} isLoading={listResponse.isLoading} />
      <DataTablePagination table={table} totalRecord={recordCount} loading={listResponse.isLoading} />
    </div>
  );
}
