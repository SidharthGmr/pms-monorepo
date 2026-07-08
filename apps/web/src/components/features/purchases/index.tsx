'use client';
import { CustomDataTable } from '@/components/Table/data-table';
import { DataTablePagination } from '@/components/Table/data-table-pagination';
import { PurchaseDto } from '@/dtos/purchase.dto';
import { useGetAllPurchases } from '@/hooks/service-hooks/usePurchaseService';
import { PurchaseFilterParams } from '@/params/purchase.params';
import { useEffect, useState } from 'react';
import { usePurchaseColumns } from './columns';
import { useSearchParams } from 'next/navigation';
import config from '@/config';
import { useTanstackTablePagination } from '@/hooks/use-tanstack-table-pagination';
import { useTanstackTableSorting } from '@/hooks/use-tanstack-table-sorting';
import { useCustomDataTable } from '@/hooks/use-custom-table';
import PurchaseListFilter from './filter';

export default function PurchasesList() {
  const searchParams = useSearchParams();

  const [data, setData] = useState<PurchaseDto[]>([]);
  const [recordCount, setRecordCount] = useState<number>(0);

  const [filterParams, setFilterParams] = useState<PurchaseFilterParams>({
    page: +(searchParams.get('page') || 1),
    recordPerPage: +(searchParams.get('recordPerPage') || config.recordPerPage),
    search: searchParams.get('search') || '',
  });

  const columns = usePurchaseColumns();

  const { data: purchasesResponse, isLoading, isError } = useGetAllPurchases(filterParams);

  useEffect(() => {
    if (purchasesResponse?.data?.data) {
      setData(purchasesResponse.data.data.data ?? []);
      setRecordCount(purchasesResponse.data.data.totalRecord ?? 0);
    }
  }, [purchasesResponse]);

  const { sorting, onSortingChange } = useTanstackTableSorting<PurchaseDto>('', 'desc', columns);
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

  const resetForm = () => {
    setFilterParams({
      search: undefined,
      page: 1,
      recordPerPage: config.recordPerPage,
    });
  };

  if (isError) {
    return <div className="text-red-500 font-bold p-4 text-center">Failed to load purchases. Please try again.</div>;
  }

  return (
    <div className="w-full space-y-4">
      <PurchaseListFilter
        table={table}
        resetForm={resetForm}
        initialSearch={filterParams.search}
        onTextChange={(value) => setFilterParams((prev) => ({ ...prev, search: value || undefined, page: 1 }))}
      />
      <div className="rounded-md border bg-white shadow-sm overflow-hidden">
        <CustomDataTable columns={columns} table={table} isLoading={isLoading} />
      </div>
      <div className="py-2">
        <DataTablePagination table={table} totalRecord={recordCount} loading={isLoading} />
      </div>
    </div>
  );
}
