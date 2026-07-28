'use client';
import { Cross2Icon } from '@radix-ui/react-icons';
import { Table } from '@tanstack/react-table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useDebounce } from 'use-debounce';
import { useEffect, useState } from 'react';
import { DateRange } from 'react-day-picker';
import useFilterHook from '@/hooks/use-filter-hook';
import { StatusValues } from '@/enums/status-values.enum';
import { DateRangePicker } from '@/components/common/date-range-picker';
import { SelectSearch } from '@/components/common/select-search';

const SUPPLIER_STATUS_OPTIONS = [
  { label: 'Published', value: StatusValues.Published },
  { label: 'Draft', value: StatusValues.Draft },
];

interface SupplierListFilterProps<TData> {
  table: Table<TData>;
  onTextChange?: (q: string) => void;
  onStatusChange?: (value: string) => void;
  onStartDateChanged?: (date: Date | undefined) => void;
  onEndDateChanged?: (date: Date | undefined) => void;
  resetForm?: () => void;
}

export default function SupplierListFilter<TData>({
  table,
  onTextChange,
  onStatusChange,
  onStartDateChanged,
  onEndDateChanged,
  resetForm,
}: SupplierListFilterProps<TData>) {
  const [searchedText, setSearchedText] = useState('');
  const [searchedValue] = useDebounce(searchedText, 600);
  const [isFiltered, setIsFiltered] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  useEffect(() => {
    onTextChange?.(searchedValue);
    table.setPageIndex(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchedValue]);

  useEffect(() => {
    onStartDateChanged?.(dateRange?.from);
    onEndDateChanged?.(dateRange?.to);
    table.setPageIndex(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange]);

  const {
    data: statusDatas,
    selectedValue: status,
    setSelectedValue: setStatus,
    onValueChange: onStatusValueChange,
    isFiltered: isStatusFiltered,
    setIsFiltered: setIsStatusFiltered,
  } = useFilterHook({
    inputData: SUPPLIER_STATUS_OPTIONS,
    dataMapper: (el) => ({
      label: el.label,
      value: el.value,
    }),
    onChange: (value) => {
      onStatusChange?.(value);
      table.setPageIndex(0);
    },
  });

  // Only offer Reset once something is actually filtered.
  useEffect(() => {
    const isDateRangeFiltered = !!(dateRange?.from || dateRange?.to);
    setIsFiltered(isStatusFiltered || !!searchedText || isDateRangeFiltered);
  }, [isStatusFiltered, searchedText, dateRange]);

  const resetFilter = () => {
    setSearchedText('');
    setStatus('');
    setIsStatusFiltered(false);
    setIsFiltered(false);
    setDateRange(undefined);
    table.setPageIndex(0);
    resetForm?.();
  };

  return (
    <div className="grid grid-cols-1 gap-2 md:grid-cols-3 xl:grid-cols-4">
      <Input
        placeholder="Search by name, contact, email..."
        value={searchedText}
        onChange={(e) => setSearchedText(e.target.value)}
        className="bg-background"
      />
      <div className="w-full overflow-hidden lg:w-auto">
        <DateRangePicker mode="range" value={dateRange} selected={dateRange} onSelect={setDateRange} numberOfMonthsToShow={2} />
      </div>
      <div>
        <SelectSearch
          value={status}
          placeholder="Filter by status"
          items={statusDatas}
          onChange={onStatusValueChange}
          buttonClass="bg-background"
          containerName="supplier-status"
          disableSearch
        />
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
