'use client';
import { SelectSearch } from '@/components/common/select-search';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatusValues } from '@/enums/status-values.enum';
import useFilterHook from '@/hooks/use-filter-hook';
import { Cross2Icon } from '@radix-ui/react-icons';
import { Table } from '@tanstack/react-table';
import { useEffect, useState } from 'react';
import { useDebounce } from 'use-debounce';

const STATUS_OPTIONS = [
  { label: 'Published', value: StatusValues.Published },
  { label: 'Draft', value: StatusValues.Draft },
];

interface MasterAttributeFilterProps<TData> {
  table: Table<TData>;
  onTextChange?: (q: string) => void;
  onStatusChange?: (value: string) => void;
  resetForm?: () => void;
}

export default function MasterAttributeFilter<TData>({ table, onTextChange, onStatusChange, resetForm }: MasterAttributeFilterProps<TData>) {
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
    inputData: STATUS_OPTIONS,
    dataMapper: (el) => ({ label: el.label, value: el.value }),
    onChange: (value) => {
      onStatusChange?.(value);
      table.setPageIndex(0);
    },
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
    <div className="grid grid-cols-1 gap-2 md:grid-cols-3 xl:grid-cols-4">
      <Input
        placeholder="Search by name or code..."
        value={searchedText}
        onChange={(e) => setSearchedText(e.target.value)}
        className="bg-background"
      />
      <div>
        <SelectSearch
          value={status}
          placeholder="Filter by status"
          items={statusDatas}
          onChange={onStatusValueChange}
          buttonClass="bg-background"
          containerName="master-attribute-status"
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
