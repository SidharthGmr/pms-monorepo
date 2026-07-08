'use client';

import { CheckIcon, MagnifyingGlassIcon, PlusCircledIcon } from '@radix-ui/react-icons';
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList, CommandSeparator } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import React, { useEffect, useState } from 'react';

import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import DropdownBasicDto from '@/dtos/dropdown-basic.dto';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { IoClose } from 'react-icons/io5';

// Define the props type
interface SelectSearchMultiProps {
  items: DropdownBasicDto[];
  placeholder?: string;
  removePlaceholder?: string;
  value?: any[];
  onChange?: (value: any[]) => void;
  onSearchValueChange?: (value: string) => void;
  containerName?: string;
  buttonClass?: string;
  valueShow?: boolean;
  itemSize?: number;
}

// The updated SelectSearch component
export function SelectSearchMulti({
  items,
  placeholder = 'Select',
  value,
  onChange,
  valueShow = true,
  onSearchValueChange,
  containerName = '',
  buttonClass = '',
  removePlaceholder,
  itemSize = 3
}: SelectSearchMultiProps) {
  const [selectedValues, setSelectedValues] = useState<Set<string>>(new Set());
  const [options, setOptions] = useState<DropdownBasicDto[]>([]);
  const [filteredOptions, setFilteredOptions] = useState<DropdownBasicDto[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');

  const clearSelectedValues = () => {
    const newSet = new Set<string>();
    setSelectedValues(newSet);
  };

  // Custom filter function to search by key
  const filter = (term: string) => {
    const result = options.filter(
      (item) =>
        item.label.toLowerCase().includes(term.toLowerCase()) ||
        (item.childItems && item.childItems.some((child) => child.label.toLowerCase().includes(term.toLowerCase())))
    );

    setFilteredOptions(result);
    setSearchTerm(term);
    if (onSearchValueChange) {
      onSearchValueChange(term);
    }
  };

  useEffect(() => {
    setSelectedValues(new Set<string>(value as string[]));
  }, [value]);

  useEffect(() => {
    setOptions(items);
    setFilteredOptions(items);
  }, [items]);

  return (
    <Popover modal={true}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className={`h-12 w-full justify-start ${buttonClass}`}>
          <PlusCircledIcon className="mr-1 h-4 w-4" />
          {placeholder}

          {valueShow && selectedValues?.size > 0 && (
            <>
              <Separator orientation="vertical" className="mx-2 h-4" />
              <Badge variant="default" className="rounded-sm px-2 font-medium lg:hidden">
                {selectedValues.size}
              </Badge>
              <div className="hidden space-x-1 lg:flex">
                {selectedValues.size > itemSize ? (
                  <Badge variant="green" className="py-2 rounded-sm border-0">
                    {selectedValues.size} selected
                  </Badge>
                ) : (
                  <>
                    {filteredOptions
                      .filter((e) => selectedValues.has(e.value as string))
                      .map((option: any) => {
                        return (
                          <Badge key={option.value.toString()} variant="green" className="py-2 rounded-sm border-0">
                            {option.label}
                          </Badge>
                        );
                      })}
                    {filteredOptions
                      .flatMap((e) => e.childItems || [])
                      .filter((e) => selectedValues.has(e.value as string))
                      .map((option: any) => {
                        return (
                          <Badge key={option.value.toString()} variant="default" className="rounded-sm px-1 font-normal border-0">
                            {option.label}
                          </Badge>
                        );
                      })}
                  </>
                )}
              </div>
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] max-h-[var(--radix-popover-content-available-height)] p-0" align="start">
        <Command>
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
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup>
              {filteredOptions.map((option) => {
                const isSelected = selectedValues.has(option.value as string);
                return (
                  <React.Fragment key={`${option.value}-${containerName}`}>
                    <CommandItem
                      key={`${containerName} - ${option.value.toString()}`}
                      onSelect={() => {
                        if (isSelected) {
                          selectedValues.delete(option.value as string);
                        } else {
                          selectedValues.add(option.value as string);
                        }
                        const filterValues = Array.from(selectedValues);
                        if (onChange) {
                          onChange(filterValues);
                        }
                      }}
                    >
                      <div
                        className={cn(
                          'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary',
                          isSelected ? 'bg-primary text-primary-foreground' : 'opacity-50 [&_svg]:invisible'
                        )}
                      >
                        <CheckIcon className={cn('h-4 w-4')} />
                      </div>
                      {option.icon && <option.icon className="mr-2 h-4 w-4 text-muted-foreground" />}
                      <span>{option.label}</span>
                    </CommandItem>

                    {option.childItems &&
                      option.childItems.length > 0 &&
                      option.childItems.map((childitem, childindex) => {
                        const isSelectedInner = selectedValues.has(childitem.value as string);

                        return (
                          <CommandItem
                            key={`${childitem.value}-${childindex}-${containerName}`}
                            onSelect={() => {
                              if (isSelectedInner) {
                                selectedValues.delete(childitem.value as string);
                              } else {
                                selectedValues.add(childitem.value as string);
                              }
                              const filterValues = Array.from(selectedValues);
                              if (onChange) {
                                onChange(filterValues);
                              }
                            }}
                            style={{ paddingLeft: `20px` }} // Apply padding only to child items
                          >
                            <div
                              className={cn(
                                'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary',
                                isSelectedInner ? 'bg-primary text-primary-foreground' : 'opacity-50 [&_svg]:invisible'
                              )}
                            >
                              <CheckIcon className={cn('h-4 w-4')} />
                            </div>
                            {childitem.icon && <childitem.icon className="mr-2 h-4 w-4 text-muted-foreground" />}
                            <span>{childitem.label}</span>
                          </CommandItem>
                        );
                      })}
                  </React.Fragment>
                );
              })}
            </CommandGroup>
            {selectedValues.size > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem onSelect={clearSelectedValues} className="justify-center text-center cursor-pointer">
                    {removePlaceholder ? removePlaceholder : 'Clear filters'}   <IoClose />
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
