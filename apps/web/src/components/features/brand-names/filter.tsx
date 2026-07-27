'use client';
import { Cross2Icon } from '@radix-ui/react-icons';
import { Table } from '@tanstack/react-table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useDebounce } from 'use-debounce';
import { useEffect, useState } from 'react';
import { SelectSearch } from '../../common/select-search';
import useFilterHook from '@/hooks/use-filter-hook';
import StatusData from '@/data/status.data';

interface BrandNameListFilterProps<TData> {
  table: Table<TData>;
  onTextChange?: (q: string) => void;
  onStatusChange?: (value: string) => void;
  resetForm?: () => void;
  showStatus?: boolean;
}

export default function BrandNameListFilter<TData>({
  table,
  onTextChange,
  onStatusChange,
  resetForm,
  showStatus = true,
}: BrandNameListFilterProps<TData>) {
  const [searchedText, setSearchedText] = useState('');
  const [searchedValue] = useDebounce(searchedText, 600);
  const [isFiltered, setIsFiltered] = useState(false);

  useEffect(() => {
    onTextChange?.(searchedValue);
    table.setPageIndex(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchedValue]);

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

  useEffect(() => {
    setIsFiltered(isStatusFiltered || !!searchedText);
  }, [isStatusFiltered, searchedText]);

  const resetFilter = () => {
    setSearchedText('');
    setStatus('');
    setIsStatusFiltered(false);
    setIsFiltered(false);
    table.setPageIndex(0);
    resetForm?.();
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-2">
      <Input placeholder="Search by brand name..." value={searchedText} onChange={(e) => setSearchedText(e.target.value)} />

      {showStatus && (
        <SelectSearch value={status} placeholder="Filter by status" items={statusDatas} onChange={onStatusValueChange} buttonClass="" disableSearch />
      )}

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
