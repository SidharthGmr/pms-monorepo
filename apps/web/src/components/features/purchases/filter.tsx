'use client';

import { DateRangePicker } from '@/components/common/date-range-picker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Cross2Icon } from '@radix-ui/react-icons';
import { Table } from '@tanstack/react-table';
import { useEffect, useState } from 'react';
import { DateRange } from 'react-day-picker';
import { useDebounce } from 'use-debounce';

interface PurchaseListFilterProps<TData> {
  table: Table<TData>;
  onTextChange?: (q: string) => void;
  onStartDateChanged?: (date: Date | undefined) => void;
  onEndDateChanged?: (date: Date | undefined) => void;
  resetForm?: () => void;
  initialSearch?: string;
}

export default function PurchaseListFilter<TData>({
  table,
  onTextChange,
  onStartDateChanged,
  onEndDateChanged,
  resetForm,
  initialSearch = '',
}: PurchaseListFilterProps<TData>) {
  const [searchedText, setSearchedText] = useState(initialSearch);
  const [searchedValue] = useDebounce(searchedText, 1000);
  const [isFiltered, setIsFiltered] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  useEffect(() => {
    if (onTextChange) {
      onTextChange(searchedValue);
    }
    table.setPageIndex(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchedValue]);

  useEffect(() => {
    onStartDateChanged?.(dateRange?.from);
    onEndDateChanged?.(dateRange?.to);
    table.setPageIndex(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange]);

  const resetFilter = () => {
    setSearchedText('');
    setDateRange(undefined);
    setIsFiltered(false);
    table.setPageIndex(0);
    resetForm?.();
  };

  useEffect(() => {
    setIsFiltered(!!searchedText || !!(dateRange?.from || dateRange?.to));
  }, [searchedText, dateRange]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-2">
      <Input placeholder="Search invoice or supplier..." value={searchedText} onChange={(e) => setSearchedText(e.target.value)} />

      <div className="w-full overflow-hidden lg:w-auto">
        <DateRangePicker mode="range" value={dateRange} selected={dateRange} onSelect={setDateRange} numberOfMonthsToShow={2} />
      </div>

      <div className="place-content-center">
        {isFiltered && (
          <div className="flex justify-start">
            <Button variant="destructive" onClick={resetFilter} className="h-8 px-2 lg:px-3">
              Reset
              <Cross2Icon className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
