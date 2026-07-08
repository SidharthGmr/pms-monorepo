'use client';
import { Cross2Icon } from '@radix-ui/react-icons';
import { Table } from '@tanstack/react-table';
import { Input } from '@/components/ui/input';
import { useDebounce } from 'use-debounce';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import useFilterHook from '@/hooks/use-filter-hook';
import { DateRange } from 'react-day-picker';
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
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-2">
        <Input placeholder="Search by name..." value={searchedText} onChange={(event) => setSearchedText(event.target.value)} className="" />
        <SelectSearch
          value={status}
          placeholder="Filter by status"
          items={statusDatas}
          onChange={onStatusValueChange}
          buttonClass=""
          disableSearch={true}
        />
        <div className="overflow-hidden">
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
    </>
  );
}
