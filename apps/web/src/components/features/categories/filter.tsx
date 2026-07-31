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
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

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
  onIncludeDeletedChange?: (value: boolean) => void;
}

export default function CategoryListFilter<TData>({
  table,
  onTextChange,
  onStatusChange,
  resetForm,
  onStartDateChanged,
  onEndDateChanged,
  onIncludeDeletedChange,
}: CategoryListFilterProps<TData>) {
  const [searchedText, setSearchedText] = useState('');
  const [searchedValue] = useDebounce(searchedText, 1000);
  const [isFiltered, setIsFiltered] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [includeDeleted, setIncludeDeleted] = useState(false);

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
    setIncludeDeleted(false);
    table.setPageIndex(0);
    resetForm?.();
  };

  useEffect(() => {
    const isDateRangeFiltered = !!(dateRange?.from || dateRange?.to);
    setIsFiltered(isStatusFiltered || !!searchedText || isDateRangeFiltered || includeDeleted);
  }, [isStatusFiltered, searchedText, dateRange, includeDeleted]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-2">
      <Input placeholder="Search by name..." value={searchedText} onChange={(e) => setSearchedText(e.target.value)} className="bg-background pl-9" />
      <div className="w-full overflow-hidden lg:w-auto">
        <DateRangePicker mode="range" value={dateRange} selected={dateRange} onSelect={setDateRange} numberOfMonthsToShow={2} />
      </div>
      <div className="">
        <SelectSearch
          value={status}
          placeholder="Filter by status"
          items={statusDatas}
          onChange={onStatusValueChange}
          buttonClass="bg-background"
          disableSearch
        />
      </div>
      <div className="flex items-center gap-2 place-content-center">
        <Checkbox
          id="category-include-deleted"
          checked={includeDeleted}
          onCheckedChange={(checked) => {
            const next = checked === true;
            setIncludeDeleted(next);
            onIncludeDeletedChange?.(next);
            table.setPageIndex(0);
          }}
        />
        <Label htmlFor="category-include-deleted" className="text-sm font-normal whitespace-nowrap">
          Show deleted
        </Label>
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
