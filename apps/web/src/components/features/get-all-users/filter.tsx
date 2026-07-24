'use client';
import { Cross2Icon } from '@radix-ui/react-icons';
import { Table } from '@tanstack/react-table';
import { Input } from '@/components/ui/input';
import { useDebounce } from 'use-debounce';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import useFilterHook from '@/hooks/use-filter-hook';
import { DateRange } from 'react-day-picker';
import { Search } from 'lucide-react';
import { SelectSearch } from '../../common/select-search';
import { DateRangePicker } from '../../common/date-range-picker';

// Define StatusData if not imported from elsewhere
const StatusData = [
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
  { label: 'Pending', value: 'pending' },
];

interface ECardListFilterProps<TData> {
  table: Table<TData>;
  onTextChange?: (q: string) => void;
  onStatusChange?: (selectedValues: string) => void;
  onStartDateChanged?: (date: Date | undefined) => void;
  onEndDateChanged?: (date: Date | undefined) => void;
  resetForm?: () => void;
}

export default function UserListListFilter<TData>({
  table,
  onTextChange,
  onStatusChange,
  onStartDateChanged,
  onEndDateChanged,
  resetForm,
}: ECardListFilterProps<TData>) {
  const [isFiltered, setIsFiltered] = useState(false);

  const {
    data: statusDatas,
    selectedValue: status,
    setSelectedValue: setStatus,
    onValueChange: onStatusValueChange,
    isFiltered: isStatusFiltered,
    setIsFiltered: setIsStatusFiltered,
  } = useFilterHook({
    inputData: StatusData || [],
    dataMapper: (el) => ({
      label: el.label || '',
      value: el.value.toString(),
    }),
    onChange: onStatusChange,
  });

  const [searchedText, setSearchedText] = useState('');
  const [searchedValue] = useDebounce(searchedText, 1000);
  useEffect(() => {
    if (onTextChange) {
      onTextChange(searchedValue);
    }
    table.setPageIndex(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchedValue]);

  //useState for date
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  useEffect(() => {
    onStartDateChanged?.(dateRange?.from);
    onEndDateChanged?.(dateRange?.to);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange]);

  const resetFilter = () => {
    setIsFiltered(false);
    setIsStatusFiltered(false);
    setSearchedText('');
    setStatus('');
    setDateRange(undefined);
    table.setPageIndex(0);
    resetForm?.();
  };

  useEffect(() => {
    const isDateRangeFiltered = !!dateRange?.from || !!dateRange?.to;
    setIsFiltered(isStatusFiltered || !!searchedText || isDateRangeFiltered);
  }, [isStatusFiltered, searchedText, dateRange]);

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border/60 bg-muted/30 p-3 lg:flex-row lg:items-center">
      <div className="relative w-full lg:max-w-xs">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name..."
          value={searchedText}
          onChange={(event) => setSearchedText(event.target.value)}
          className="bg-background pl-9"
        />
      </div>

      <div className="w-full lg:w-[190px]">
        <SelectSearch
          value={status}
          placeholder="Filter by status"
          items={statusDatas}
          onChange={onStatusValueChange}
          buttonClass="bg-background"
          disableSearch={true}
        />
      </div>

      <div className="w-full overflow-hidden lg:w-auto">
        <DateRangePicker mode="range" value={dateRange} selected={dateRange} onSelect={setDateRange} numberOfMonthsToShow={2} />
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
