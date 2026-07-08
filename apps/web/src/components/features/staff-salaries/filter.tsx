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
import { useEffect, useState } from 'react';
import { PaymentStatus } from '@/enums/payment-status.enum';

interface StaffSalaryListFilterProps<TData> {
  table: Table<TData>;
  onTextChange?: (q: string) => void;
  onStatusChange?: (value: string) => void;
  onMonthChange?: (value: string) => void;
  onYearChange?: (value: string) => void;
  resetForm?: () => void;
  onStartDateChanged?: (date: Date | undefined) => void;
  onEndDateChanged?: (date: Date | undefined) => void;
}

const statusData = Object.values(PaymentStatus).map((status) => ({
  label: status,
  value: status,
}));

const monthsData = [
  { label: 'January', value: '1' },
  { label: 'February', value: '2' },
  { label: 'March', value: '3' },
  { label: 'April', value: '4' },
  { label: 'May', value: '5' },
  { label: 'June', value: '6' },
  { label: 'July', value: '7' },
  { label: 'August', value: '8' },
  { label: 'September', value: '9' },
  { label: 'October', value: '10' },
  { label: 'November', value: '11' },
  { label: 'December', value: '12' },
];

const yearsData = Array.from({ length: 10 }, (_, i) => {
  const year = new Date().getFullYear() - i;
  return { label: year.toString(), value: year.toString() };
});

export default function StaffSalaryListFilter<TData>({
  table,
  onTextChange,
  onStatusChange,
  onMonthChange,
  onYearChange,
  resetForm,
  onStartDateChanged,
  onEndDateChanged,
}: StaffSalaryListFilterProps<TData>) {
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

  const {
    data: statusList,
    selectedValue: status,
    setSelectedValue: setStatus,
    onValueChange: onStatusValueChange,
    isFiltered: isStatusFiltered,
    setIsFiltered: setIsStatusFiltered,
  } = useFilterHook({
    inputData: statusData,
    dataMapper: (el) => ({
      label: el.label,
      value: el.value,
    }),
    onChange: onStatusChange,
  });

  const {
    data: monthsList,
    selectedValue: month,
    setSelectedValue: setMonth,
    onValueChange: onMonthValueChange,
    isFiltered: isMonthFiltered,
    setIsFiltered: setIsMonthFiltered,
  } = useFilterHook({
    inputData: monthsData,
    dataMapper: (el) => ({
      label: el.label,
      value: el.value,
    }),
    onChange: onMonthChange,
  });

  const {
    data: yearsList,
    selectedValue: year,
    setSelectedValue: setYear,
    onValueChange: onYearValueChange,
    isFiltered: isYearFiltered,
    setIsFiltered: setIsYearFiltered,
  } = useFilterHook({
    inputData: yearsData,
    dataMapper: (el) => ({
      label: el.label,
      value: el.value,
    }),
    onChange: onYearChange,
  });

  const resetFilter = () => {
    setSearchedText('');
    setStatus('');
    setIsStatusFiltered(false);
    setMonth('');
    setIsMonthFiltered(false);
    setYear('');
    setIsYearFiltered(false);
    setIsFiltered(false);
    setDateRange(undefined);
    table.setPageIndex(0);
    resetForm?.();
  };

  const hasFilters = searchedText || isStatusFiltered || isMonthFiltered || isYearFiltered || dateRange;

  return (
    <div className="space-y-4 p-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <Input
          placeholder="Search by staff ID or remarks..."
          value={searchedText}
          onChange={(event) => setSearchedText(event.target.value)}
          className="h-10 w-full md:max-w-sm"
        />

 
        <SelectSearch
          buttonClass="w-full md:w-[180px]"
          placeholder="Select Status"
          disableSearch={true}
          items={statusList}
          value={status}
          onChange={(value) => {
            onStatusValueChange(value); 
          }}
        />

        <SelectSearch
          buttonClass="w-full md:w-[150px]"
          placeholder="Select Month"
          disableSearch={true}
          items={monthsList}
          value={month}
          onChange={(value) => {
            onMonthValueChange(value); 
          }}
        />

        <SelectSearch
          buttonClass="w-full md:w-[120px]"
          placeholder="Select Year"
          disableSearch={true}
          items={yearsList}
          value={year}
          onChange={(value) => {
            onYearValueChange(value);
            setIsFiltered(true);
          }}
        />
   <div className="overflow-hidden">
        <DateRangePicker mode="range" value={dateRange} selected={dateRange} onSelect={setDateRange} numberOfMonthsToShow={2} />
      </div>
       
        {hasFilters && (
          <Button variant="ghost" onClick={resetFilter} className="h-10 px-4">
            Reset
            <Cross2Icon className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
