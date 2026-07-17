'use client';
import { Cross2Icon } from '@radix-ui/react-icons';
import { Table } from '@tanstack/react-table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useDebounce } from 'use-debounce';
import { useEffect, useState } from 'react';

interface SupplierListFilterProps<TData> {
  table: Table<TData>;
  onTextChange?: (q: string) => void;
  resetForm?: () => void;
}

export default function SupplierListFilter<TData>({ table, onTextChange, resetForm }: SupplierListFilterProps<TData>) {
  const [searchedText, setSearchedText] = useState('');
  const [searchedValue] = useDebounce(searchedText, 600);

  useEffect(() => {
    onTextChange?.(searchedValue);
    table.setPageIndex(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchedValue]);

  const resetFilter = () => {
    setSearchedText('');
    resetForm?.();
  };

  return (
    <div className="flex gap-2 items-center">
      <Input placeholder="Search by name, contact, email..." value={searchedText} onChange={(e) => setSearchedText(e.target.value)} className="max-w-xs" />
      {!!searchedText && (
        <Button variant="outline" onClick={resetFilter} className="h-8 px-2 lg:px-3 border-destructive text-destructive hover:bg-destructive/10">
          Reset
          <Cross2Icon className="ml-2 h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
