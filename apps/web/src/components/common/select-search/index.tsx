

'use client';

import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import DropdownBasicDto from '@/dtos/dropdown-basic.dto';
import { cn } from '@/lib/utils';
import { CaretSortIcon, CheckIcon, MagnifyingGlassIcon } from '@radix-ui/react-icons';
import React, { useEffect, useMemo, useState } from 'react';

// Props
interface SelectSearchProps {
  items: DropdownBasicDto[];
  placeholder?: string;
  varient?: 'default' | 'color';
  value?: string | number;
  valueType?: 'string' | 'number';
  onChange: (value: string | number) => void;
  onSearchValueChange?: (value: string) => void;
  buttonClass?: string;
  containerName?: string;
  disableSearch?: boolean;
  addComponent?: React.ReactNode;
  newRecordValue?: (searchTerm?: string) => void;
}

// Status style map
const ColorStyle: Record<string, string> = {
  green: 'bg-green-100 text-green-600 border-green-600',
  rose: 'bg-rose-100 text-rose-600 border-rose-600',
  orange: 'bg-orange-100 text-orange-600 border-orange-600',
  blue: 'bg-sky-100 text-sky-600 border-sky-600',
  default: 'bg-accent text-accent-foreground border',
};

const statusStyles: Record<string, string> = {
  Published: ColorStyle.green,
  success: ColorStyle.green,
  completed: ColorStyle.green,
  approve: ColorStyle.green,
  passed: ColorStyle.green,
  Draft: ColorStyle.orange,
  review: ColorStyle.orange,
  InReview: ColorStyle.orange,
  pending: ColorStyle.rose,
  Trash: ColorStyle.rose,
  Reject: ColorStyle.blue,
};

export function SelectSearch({
  items,
  placeholder = 'Select',
  value,
  valueType = 'string',
  onChange,
  onSearchValueChange,
  buttonClass,
  containerName = '',
  disableSearch = false,
  varient = 'default',
  addComponent,
  newRecordValue,
}: SelectSearchProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredOptions, setFilteredOptions] = useState<DropdownBasicDto[]>([]);

  useEffect(() => {
    setFilteredOptions(items);
  }, [items]);

  useEffect(() => {
    if (!open) setSearchTerm('');
  }, [open]);

  const filter = (term: string) => {
    const result = items.filter(
      (item) =>
        item.label.toLowerCase().includes(term.toLowerCase()) ||
        (item.childItems &&
          item.childItems.some((child) =>
            child.label.toLowerCase().includes(term.toLowerCase())
          ))
    );
    setFilteredOptions(result);
    setSearchTerm(term);
    onSearchValueChange?.(term);
  };

  const findItem = useMemo(() => {
    const normalized = String(value ?? '').toLowerCase();
    for (const item of items) {
      if (String(item.value).toLowerCase() === normalized) return item;
      const child = item.childItems?.find(
        (c) => String(c.value).toLowerCase() === normalized
      );
      if (child) return child;
    }
    return undefined;
  }, [value, items]);

  const handleSelect = (selectedValue: string | number) => {
    const parsedValue =
      valueType === 'number' ? Number(selectedValue) : selectedValue;
    onChange(parsedValue);
    setOpen(false);
  };

  const renderOption = (item: DropdownBasicDto, isChild = false) => (
    <CommandItem
      key={`${item.value}-${containerName}`}
      value={String(item.value)}
      onSelect={() => handleSelect(Array.isArray(item.value) ? item.value[0] : item.value)}
      className={isChild ? 'ps-5' : ''}
    >
      {item.label}
      <CheckIcon
        className={cn(
          'ml-auto h-4 w-4',
          value == item.value ? 'opacity-100' : 'opacity-0'
        )}
      />
    </CommandItem>
  );

  return (
    <Popover open={open} onOpenChange={setOpen} modal>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          role="combobox"
          aria-expanded={open}
          className={cn(
            'min-w-40 h-11 w-full text-sm',
            buttonClass,
            varient === 'color' && value
              ? statusStyles[value as keyof typeof statusStyles]
              : ''
          )}
        >
          {findItem?.label ?? placeholder}
          <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="p-0 w-[var(--radix-popover-trigger-width)] max-h-[var(--radix-popover-content-available-height)] mt-0">
        <Command>
          {!disableSearch && (
            <div className="flex items-center border-b px-3">
              <MagnifyingGlassIcon className="mr-2 h-4 w-4 shrink-0 opacity-50" />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => filter(e.target.value)}
                className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          )}

          <CommandList>
            {addComponent ? (
              <CommandEmpty
                onClick={() => newRecordValue?.(searchTerm)}
                className="flex justify-center items-center p-2 text-sm text-center cursor-pointer"
              >
                <span>
                  Add{' '}
                  <strong className="underline">
                    <em>{searchTerm}</em>
                  </strong>{' '}
                  as new record.
                </span>
              </CommandEmpty>
            ) : (
              <CommandEmpty>No matches found.</CommandEmpty>
            )}

            <CommandGroup>
              {filteredOptions.map((item) => (
                <React.Fragment key={`${item.value}-${containerName}`}>
                  {renderOption(item)}
                  {item.childItems?.map((child) => renderOption(child, true))}
                </React.Fragment>
              ))}
            </CommandGroup>
          </CommandList>

          {addComponent}
        </Command>
      </PopoverContent>
    </Popover>
  );
}
