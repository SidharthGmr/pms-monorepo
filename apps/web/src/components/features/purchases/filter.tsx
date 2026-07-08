'use client';

import { Cross2Icon } from '@radix-ui/react-icons';
import { Table } from '@tanstack/react-table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useDebounce } from 'use-debounce';
import { useEffect, useState } from 'react';

interface PurchaseListFilterProps<TData> {
  table: Table<TData>;
  onTextChange?: (q: string) => void;
  resetForm?: () => void;
  initialSearch?: string;
}

export default function PurchaseListFilter<TData>({
  table,
  onTextChange,
  resetForm,
  initialSearch = ''
}: PurchaseListFilterProps<TData>) {
  const [searchedText, setSearchedText] = useState(initialSearch);
  const [searchedValue] = useDebounce(searchedText, 1000);
  const [isFiltered, setIsFiltered] = useState(false);

  useEffect(() => {
    if (onTextChange) {
      onTextChange(searchedValue);
    }
    table.setPageIndex(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchedValue]);

  const resetFilter = () => {
    setSearchedText('');
    setIsFiltered(false);
    table.setPageIndex(0);
    resetForm?.();
  };

  useEffect(() => {
    setIsFiltered(!!searchedText);
  }, [searchedText]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-2">
      <Input placeholder="Search invoice or supplier..." value={searchedText} onChange={(e) => setSearchedText(e.target.value)} />

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
