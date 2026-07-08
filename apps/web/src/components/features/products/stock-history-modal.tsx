'use client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useEffect, useState } from 'react';
import { useGetStockHistory } from '@/hooks/service-hooks/useProductService';
import { CustomDataTable } from '@/components/Table/data-table';
import { DataTablePagination } from '@/components/Table/data-table-pagination';
import { useStockHistoryColumns } from './stock-history-columns';
import { useTanstackTablePagination } from '@/hooks/use-tanstack-table-pagination';
import { useTanstackTableSorting } from '@/hooks/use-tanstack-table-sorting';
import { useCustomDataTable } from '@/hooks/use-custom-table';
import config from '@/config';

interface StockHistoryModalProps {
  productId: number;
  productName: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function StockHistoryModal({ productId, productName, isOpen, onClose }: StockHistoryModalProps) {
  const [data, setData] = useState<any[]>([]);
  const [recordCount, setRecordCount] = useState<number>(0);

  const [filterParams, setFilterParams] = useState({
    page: 1,
    recordPerPage: config.recordPerPage,
  });

  const columns = useStockHistoryColumns();

  const { data: stockHistoryResponse, isLoading, isError } = useGetStockHistory(productId, filterParams, isOpen);

  useEffect(() => {
    if (stockHistoryResponse?.data?.data) {
      setData(stockHistoryResponse.data.data.data ?? []);
      setRecordCount(stockHistoryResponse.data.data.totalRecord ?? 0);
    }
  }, [stockHistoryResponse]);

  const { sorting, onSortingChange } = useTanstackTableSorting<any>('createdAt', 'desc', columns);
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

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Stock History - {productName}</DialogTitle>
        </DialogHeader>
        
        {isError ? (
          <div className="py-10 text-center text-red-500">Failed to load stock history.</div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-md border bg-white shadow-sm overflow-hidden mt-4">
              <CustomDataTable columns={columns} table={table} isLoading={isLoading} />
            </div>
            <div className="py-2">
              <DataTablePagination table={table} totalRecord={recordCount} loading={isLoading} />
            </div>
          </div>
        )}
        
        <DialogFooter>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
