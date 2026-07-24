'use client';
import { Cross2Icon } from '@radix-ui/react-icons';
import { Table } from '@tanstack/react-table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useDebounce } from 'use-debounce';
import { useEffect, useState } from 'react';
import { DateRange } from 'react-day-picker';
import { Search } from 'lucide-react';
import useFilterHook from '@/hooks/use-filter-hook';
import { StatusValues } from '@/enums/status-values.enum';
import { DateRangePicker } from '@/components/common/date-range-picker';
import { SelectSearch } from '@/components/common/select-search';

const ATTRIBUTE_STATUS_OPTIONS = [
  { label: 'Published', value: StatusValues.Published },
  { label: 'Draft', value: StatusValues.Draft },
];

interface CategoryListFilterProps<TData> {
  table: Table<TData>;
  onTextChange?: (q: string) => void;
  onStatusChange?: (value: string) => void;
  resetForm?: () => void;
  onStartDateChanged?: (date: Date | undefined) => void;
  onEndDateChanged?: (date: Date | undefined) => void;
}

export default function CategoryListFilter<TData>({
  table,
  onTextChange,
  onStatusChange,
  resetForm,
  onStartDateChanged,
  onEndDateChanged,
}: CategoryListFilterProps<TData>) {
  const [searchedText, setSearchedText] = useState('');
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
  }, [dateRange]);

  const {
    data: statusDatas,
    selectedValue: status,
    setSelectedValue: setStatus,
    onValueChange: onStatusValueChange,
    isFiltered: isStatusFiltered,
    setIsFiltered: setIsStatusFiltered,
  } = useFilterHook({
    inputData: ATTRIBUTE_STATUS_OPTIONS,
    dataMapper: (el) => ({
      label: el.label,
      value: el.value,
    }),
    onChange: onStatusChange,
  });

  const resetFilter = () => {
    setSearchedText('');
    setStatus('');
    setIsStatusFiltered(false);
    setIsFiltered(false);
    setDateRange(undefined);
    table.setPageIndex(0);
    resetForm?.();
  };

  useEffect(() => {
    const isDateRangeFiltered = !!(dateRange?.from || dateRange?.to);
    setIsFiltered(isStatusFiltered || !!searchedText || isDateRangeFiltered);
  }, [isStatusFiltered, searchedText, dateRange]);

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border/60 bg-muted/30 p-3 lg:flex-row lg:items-center">
      <div className="relative w-full lg:max-w-xs">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name..."
          value={searchedText}
          onChange={(e) => setSearchedText(e.target.value)}
          className="bg-background pl-9"
        />
      </div>

      <div className="w-full overflow-hidden lg:w-auto">
        <DateRangePicker mode="range" value={dateRange} selected={dateRange} onSelect={setDateRange} numberOfMonthsToShow={2} />
      </div>

      <div className="w-full lg:w-[190px]">
        <SelectSearch value={status} placeholder="Filter by status" items={statusDatas} onChange={onStatusValueChange} buttonClass="bg-background" disableSearch />
      </div>

      {isFiltered && (
        <Button
          variant="ghost"
          onClick={resetFilter}
          className="h-9 shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive lg:ml-auto"
        >
          Reset
          <Cross2Icon className="ml-1.5 h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
