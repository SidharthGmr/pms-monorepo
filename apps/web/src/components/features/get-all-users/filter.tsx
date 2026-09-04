'use client';
import { Cross2Icon } from '@radix-ui/react-icons';
import { Table } from '@tanstack/react-table';
import { Input } from '@/components/ui/input';
import { useDebounce } from 'use-debounce';
import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Roles } from '@/enums/roles.enum';
import useFilterHook from '@/hooks/use-filter-hook';
import useGetCurrentUser from '@/hooks/useGetCurrentUser';
import { cn } from '@/lib/utils';
import { DateRange } from 'react-day-picker';
import { SelectSearch } from '../../common/select-search';
import { DateRangePicker } from '../../common/date-range-picker';

// Define StatusData if not imported from elsewhere
const StatusData = [
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
  { label: 'Pending', value: 'pending' },
];

const RoleData = [
  { label: 'Super Admin', value: Roles.SUPER_ADMIN },
  { label: 'Admin', value: Roles.ADMIN },
  { label: 'Staff', value: Roles.STAFF },
  { label: 'Customer', value: Roles.USER },
];



interface ECardListFilterProps<TData> {
  table: Table<TData>;
  onTextChange?: (q: string) => void;
  onStatusChange?: (selectedValues: string) => void;
  onRoleChange?: (selectedValues: string) => void;
  initialRole?: string;
  onStartDateChanged?: (date: Date | undefined) => void;
  onEndDateChanged?: (date: Date | undefined) => void;
  resetForm?: () => void;
}

export default function UserListListFilter<TData>({
  table,
  onTextChange,
  onStatusChange,
  onRoleChange,
  initialRole,
  onStartDateChanged,
  onEndDateChanged,
  resetForm,
}: ECardListFilterProps<TData>) {
  const [isFiltered, setIsFiltered] = useState(false);

  // Only a super admin gets the Super Admin option - same check as `active-status-toggle`.
  const { currentUser } = useGetCurrentUser();
  const isSuperAdmin = currentUser?.role === Roles.SUPER_ADMIN;
  const roleOptions = useMemo(() => RoleData.filter((option) => isSuperAdmin || option.value !== Roles.SUPER_ADMIN), [isSuperAdmin]);

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

  const {
    data: roleDatas,
    selectedValue: roleValue,
    setSelectedValue: setRoleValue,
    onValueChange: onRoleValueChange,
    isFiltered: isRoleFiltered,
    setIsFiltered: setIsRoleFiltered,
  } = useFilterHook({
    inputData: roleOptions,
    dataMapper: (el) => ({
      label: el.label,
      value: el.value.toString(),
    }),
    onChange: onRoleChange,
    initialValue: initialRole ?? '',
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
    setIsRoleFiltered(false);
    setSearchedText('');
    setStatus('');
    setRoleValue(initialRole ?? '');
    setDateRange(undefined);
    table.setPageIndex(0);
    resetForm?.();
  };

  useEffect(() => {
    const isDateRangeFiltered = !!dateRange?.from || !!dateRange?.to;
    setIsFiltered(isStatusFiltered || isRoleFiltered || !!searchedText || isDateRangeFiltered);
  }, [isStatusFiltered, isRoleFiltered, searchedText, dateRange]);

  return (
    <div className={cn('grid grid-cols-1 gap-2', onRoleChange ? 'md:grid-cols-5' : 'md:grid-cols-4')}>
      <Input
        placeholder="Search by name..."
        value={searchedText}
        onChange={(event) => setSearchedText(event.target.value)}
        className="bg-background pl-9"
      />
      <SelectSearch
        value={status}
        placeholder="Filter by status"
        items={statusDatas}
        onChange={onStatusValueChange}
        buttonClass="bg-background"
        disableSearch={true}
      />
      {onRoleChange && (
        <SelectSearch
          value={roleValue}
          placeholder="Filter by role"
          items={roleDatas}
          onChange={onRoleValueChange}
          buttonClass="bg-background"
          disableSearch={true}
        />
      )}

      <div className="w-full overflow-hidden lg:w-auto">
        <DateRangePicker mode="range" value={dateRange} selected={dateRange} onSelect={setDateRange} numberOfMonthsToShow={2} />
      </div>

      <div className="place-content-center">
        {isFiltered && (
          <Button variant="destructive" onClick={resetFilter} className="h-8 px-2 lg:px-3">
            Reset
            <Cross2Icon className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
