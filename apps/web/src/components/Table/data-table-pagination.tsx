import { ChevronLeftIcon, ChevronRightIcon, DoubleArrowLeftIcon, DoubleArrowRightIcon } from '@radix-ui/react-icons';
import { Table } from '@tanstack/react-table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

interface DataTablePaginationProps<TData> {
  table: Table<TData>;
  totalRecord?: number;
  pageSize?: number[];
  loading?: boolean;
  showRecordSelected?: boolean;
}

export function DataTablePagination<TData>({ table, totalRecord = 0, pageSize, loading, showRecordSelected }: DataTablePaginationProps<TData>) {
  let showingText = '';
  if (totalRecord && totalRecord > 0) {
    const startNumber: number = table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1;
    let endNumber: number = Number(startNumber - 1) + table.getState().pagination.pageSize;
    endNumber = endNumber > totalRecord ? totalRecord : endNumber;
    showingText = `Showing ${startNumber} to ${endNumber} of ${totalRecord} enteries`;
  }

  return (
    <div className={`flex items-center ${showRecordSelected ? 'justify-between' : 'justify-center xl:justify-end'} overflow-auto  gap-4`}>
      {showRecordSelected && (
        <div className={`flex-1 text-sm text-muted-foreground ${showRecordSelected ? 'hidden sm:block' : 'hidden'}`}>
          {table.getFilteredSelectedRowModel().rows.length} of {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
      )}

      <div className={`flex-1 flex justify-between   items-stretch md:items-center  flex-col md:flex-row gap-2 md:gap-8`}>
        <div className="flex items-center gap-3">
          <p className="text-sm font-medium mb-0 ">Rows per page</p>
          <Select
            value={`${table.getState().pagination.pageSize}`}
            onValueChange={(value) => {
              table.setPageSize(Number(value));
            }}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue placeholder={table.getState().pagination.pageSize} />
            </SelectTrigger>

            <SelectContent side="top">
              {(pageSize || [10, 25, 50, 100]).map((ps) => (
                <SelectItem key={ps} value={`${ps}`}>
                  {ps}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="text-start text-muted-foreground ">
          <p className="text-sm font-medium mb-0">{showingText}</p>
        </div>

        <div className="flex items-stretch md:items-center justify-between md:justify-center   gap-3">
          <div className={`flex items-center justify-center`}>
            <p className="text-sm font-medium mb-0">
              Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
            </p>
          </div>

          <div className="flex items-center justify-between lg:justify-center space-x-2">
            <Button
              variant="outline"
              className="  h-8 w-8 p-0 lg:flex"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage() || loading}
            >
              <span className="sr-only">Go to first page</span>
              <DoubleArrowLeftIcon className="h-4 w-4" />
            </Button>
            <Button variant="outline" className="h-8 w-8 p-0" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage() || loading}>
              <span className="sr-only">Go to previous page</span>
              <ChevronLeftIcon className="h-4 w-4" />
            </Button>
            <Button variant="outline" className="h-8 w-8 p-0" onClick={() => table.nextPage()} disabled={!table.getCanNextPage() || loading}>
              <span className="sr-only">Go to next page</span>
              <ChevronRightIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="  h-8 w-8 p-0 lg:flex"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage() || loading}
            >
              <span className="sr-only">Go to last page</span>
              <DoubleArrowRightIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
