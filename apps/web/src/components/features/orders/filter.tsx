'use client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Cross2Icon } from '@radix-ui/react-icons';
import { Table } from '@tanstack/react-table';
import { useEffect, useState } from 'react';
import { useDebounce } from 'use-debounce';

interface OrderListFilterProps<TData> {
  table: Table<TData>;
  onTextChange?: (q: string) => void;
  resetForm?: () => void;
}

export default function OrderListFilter<TData>({ table, onTextChange, resetForm }: OrderListFilterProps<TData>) {
  const [searchText, setSearchText] = useState('');
  const [debouncedText] = useDebounce(searchText, 500);
  const [isFiltered, setIsFiltered] = useState(false);

  useEffect(() => {
    if (onTextChange) {
      onTextChange(debouncedText);
    }
    table.setPageIndex(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedText]);

  useEffect(() => {
    setIsFiltered(!!searchText);
  }, [searchText]);

  const resetFilter = () => {
    setSearchText('');
    table.setPageIndex(0);
    resetForm?.();
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
      <Input placeholder="Search by order number or customer..." value={searchText} onChange={(e) => setSearchText(e.target.value)} />
      <div />
      <div className="flex items-center justify-end">
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
