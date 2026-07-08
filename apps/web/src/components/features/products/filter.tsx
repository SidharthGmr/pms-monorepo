'use client';

import { Cross2Icon } from '@radix-ui/react-icons';
import { Table } from '@tanstack/react-table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useDebounce } from 'use-debounce';
import { SelectSearch } from '../../common/select-search';
import useFilterHook from '@/hooks/use-filter-hook';
import { DateRange } from 'react-day-picker';
import { DateRangePicker } from '@/components/common/date-range-picker';
import StatusData from '@/data/status.data';
import { useGetAllCategories } from '@/hooks/service-hooks/useCategoryService';
import { useEffect, useMemo, useState } from 'react';
interface ProductListFilterProps<TData> {
  table: Table<TData>;
  onTextChange?: (q: string) => void;
  onStatusChange?: (value: string) => void;
  onCategoryTypeChange?: (selectedValues: string) => void;
  resetForm?: () => void;
  onStartDateChanged?: (date: Date | undefined) => void;
  onEndDateChanged?: (date: Date | undefined) => void;
}

export default function ProductListFilter<TData>({
  table,
  onTextChange,
  onStatusChange,
  onCategoryTypeChange,
  resetForm,
  onStartDateChanged,
  onEndDateChanged,
}: ProductListFilterProps<TData>) {
  const [searchedText, setSearchedText] = useState('');
  const [searchedValue] = useDebounce(searchedText, 1000);
  const [isFiltered, setIsFiltered] = useState(false);

  useEffect(() => {
    if (onTextChange) {
      onTextChange(searchedValue);
    }
    table.setPageIndex(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchedValue]);

  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  useEffect(() => {
    onStartDateChanged?.(dateRange?.from);
    onEndDateChanged?.(dateRange?.to);
  }, [dateRange]);

  const { data: categoriesResponse } = useGetAllCategories();
  const categoriesInputData = useMemo(() => categoriesResponse?.data.data?.data || [], [categoriesResponse]);

  const {
    data: categoryTypes,
    selectedValue: category,
    setSelectedValue: setCategoryType,
    onValueChange: onCategoryTypeValueChange,
    isFiltered: isCategoryTypeFiltered,
    setIsFiltered: setIsCategoryTypeFiltered,
  } = useFilterHook({
    inputData: categoriesInputData, // ✅ stable reference
    dataMapper: (e) => ({
      label: e.name || '',
      value: e.id?.toString() || '',
    }),
    onChange: (value) => {
      if (value) onCategoryTypeChange?.(value);
    },
  });

  const {
    data: statusDatas,
    selectedValue: status,
    setSelectedValue: setStatus,
    onValueChange: onStatusValueChange,
    isFiltered: isStatusFiltered,
    setIsFiltered: setIsStatusFiltered,
  } = useFilterHook({
    inputData: StatusData,
    dataMapper: (el) => ({
      label: el.label,
      value: el.value,
    }),
    onChange: onStatusChange,
  });

  const resetFilter = () => {
    setSearchedText('');
    setCategoryType(0);
    setIsCategoryTypeFiltered(false);
    setStatus('');
    setIsStatusFiltered(false);
    setIsFiltered(false);
    setDateRange(undefined);
    table.setPageIndex(0);
    resetForm?.();
  };

  useEffect(() => {
    const isDateRangeFiltered = dateRange?.from || dateRange?.to ? true : false;
    setIsFiltered(isStatusFiltered || !!searchedText || isDateRangeFiltered || isCategoryTypeFiltered);
  }, [isStatusFiltered, searchedText, dateRange, isCategoryTypeFiltered]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-2">
      <Input placeholder="Search by name or SKU..." value={searchedText} onChange={(e) => setSearchedText(e.target.value)} />
      <SelectSearch
        value={category}
        placeholder="Filter by Category Type"
        items={categoryTypes}
        onChange={onCategoryTypeValueChange}
        buttonClass=""
        disableSearch={true}
      />
      <div className="overflo w-hidden">
        <DateRangePicker mode="range" value={dateRange} selected={dateRange} onSelect={setDateRange} numberOfMonthsToShow={2} />
      </div>
      <SelectSearch value={status} placeholder="Filter by status" items={statusDatas} onChange={onStatusValueChange} buttonClass="" disableSearch />

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
