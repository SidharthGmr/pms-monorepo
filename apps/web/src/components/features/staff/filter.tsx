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

interface StaffListFilterProps<TData> {
  table: Table<TData>;
  onTextChange?: (q: string) => void;
  onIsActiveChange?: (value: string) => void;
  onDepartmentChange?: (value: string) => void;
  onPositionChange?: (value: string) => void;
  resetForm?: () => void;
  onStartDateChanged?: (date: Date | undefined) => void;
  onEndDateChanged?: (date: Date | undefined) => void;
}

const statusData = [
  { label: 'Active', value: 'true' },
  { label: 'Inactive', value: 'false' },
];

// These would typically come from your database or API
const departmentsData = [
  { label: 'Sales', value: 'Sales' },
  { label: 'Marketing', value: 'Marketing' },
  { label: 'IT', value: 'IT' },
  { label: 'HR', value: 'HR' },
  { label: 'Finance', value: 'Finance' },
  { label: 'Operations', value: 'Operations' },
];

const positionsData = [
  { label: 'Manager', value: 'Manager' },
  { label: 'Assistant Manager', value: 'Assistant Manager' },
  { label: 'Supervisor', value: 'Supervisor' },
  { label: 'Associate', value: 'Associate' },
  { label: 'Cashier', value: 'Cashier' },
  { label: 'Sales Representative', value: 'Sales Representative' },
];

export default function StaffListFilter<TData>({
  table,
  onTextChange,
  onIsActiveChange,
  onDepartmentChange,
  onPositionChange,
  resetForm,
  onStartDateChanged,
  onEndDateChanged,
}: StaffListFilterProps<TData>) {
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
    onChange: onIsActiveChange,
  });

  const {
    data: departmentsList,
    selectedValue: department,
    setSelectedValue: setDepartment,
    onValueChange: onDepartmentValueChange,
    isFiltered: isDepartmentFiltered,
    setIsFiltered: setIsDepartmentFiltered,
  } = useFilterHook({
    inputData: departmentsData,
    dataMapper: (el) => ({
      label: el.label,
      value: el.value,
    }),
    onChange: onDepartmentChange,
  });

  const {
    data: positionsList,
    selectedValue: position,
    setSelectedValue: setPosition,
    onValueChange: onPositionValueChange,
    isFiltered: isPositionFiltered,
    setIsFiltered: setIsPositionFiltered,
  } = useFilterHook({
    inputData: positionsData,
    dataMapper: (el) => ({
      label: el.label,
      value: el.value,
    }),
    onChange: onPositionChange,
  });

  const resetFilter = () => {
    setSearchedText('');
    setStatus('');
    setIsStatusFiltered(false);
    setDepartment('');
    setIsDepartmentFiltered(false);
    setPosition('');
    setIsPositionFiltered(false);
    setIsFiltered(false);
    setDateRange(undefined);
    table.setPageIndex(0);
    resetForm?.();
  };

  const hasFilters = searchedText || isStatusFiltered || isDepartmentFiltered || isPositionFiltered || dateRange;

  return (
    <div className="space-y-4 p-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <Input
          placeholder="Search by name, email..."
          value={searchedText}
          onChange={(event) => setSearchedText(event.target.value)}
          className="h-10 w-full md:max-w-sm"
        />

        <SelectSearch
          buttonClass="w-full md:w-[150px]"
          placeholder="Status"
          disableSearch={true}
          items={statusList}
          value={status}
          onChange={(value) => {
            onStatusValueChange(value);
            setIsFiltered(true);
          }}
        />

        <SelectSearch
          buttonClass="w-full md:w-[180px]"
          placeholder="Department"
          disableSearch={true}
          items={departmentsList}
          value={department}
          onChange={(value) => {
            onDepartmentValueChange(value);
            setIsFiltered(true);
          }}
        />

        <SelectSearch
          buttonClass="w-full md:w-[180px]"
          placeholder="Position"
          disableSearch={true}
          items={positionsList}
          value={position}
          onChange={(value) => {
            onPositionValueChange(value);
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
