'use client';

import { Input } from '@/components/ui/input';
import { Popover, PopoverAnchor, PopoverContent } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import DropdownBasicDto from '@/types/dropdown-basic.dto';
import { CaretSortIcon, CheckIcon, PlusCircledIcon } from '@radix-ui/react-icons';
import React, { useEffect, useMemo, useRef, useState } from 'react';

export interface InputSelectItem extends DropdownBasicDto {
  /** Extra right-aligned cells after the label, one per entry in `detailHeaders` (e.g. sale price, stock). */
  details?: React.ReactNode[];
}

interface InputSelectProps {
  items: InputSelectItem[];
  placeholder?: string;
  value?: string | number;
  valueType?: 'string' | 'number';
  onChange: (value: string | number) => void;
  onSearchValueChange?: (value: string) => void;
  inputClass?: string;
  /** Widen or restyle the dropdown, e.g. 'w-[560px]' when detail columns need more room than the input. */
  contentClass?: string;
  containerName?: string;
  /** When false, only a listed option can become the value; typed text is just a filter. Default true. */
  allowCustomValue?: boolean;
  disabled?: boolean;
  /** Column headings for `details` cells; also renders a header row above the options. */
  detailHeaders?: string[];
  /** Renders a pinned "+ Add" action at the top of the dropdown, called with the current search text. */
  onAddNew?: (searchTerm?: string) => void;
  addNewLabel?: string;
  addComponent?: React.ReactNode;
  newRecordValue?: (searchTerm?: string) => void;
}

// Free text keeps its string form unless the caller asked for numbers and the text is one.
const parseText = (text: string, valueType: 'string' | 'number') => {
  if (valueType === 'number' && text.trim() !== '' && Number.isFinite(Number(text))) return Number(text);
  return text;
};

export function InputSelect({
  items,
  placeholder = 'Type or select',
  value,
  valueType = 'string',
  onChange,
  onSearchValueChange,
  inputClass,
  contentClass,
  containerName = '',
  allowCustomValue = true,
  disabled = false,
  detailHeaders,
  onAddNew,
  addNewLabel = 'Add Item',
  addComponent,
  newRecordValue,
}: InputSelectProps) {
  const [open, setOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeIndex, setActiveIndex] = useState(-1);
  const anchorRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const flatItems = useMemo(() => {
    const flat: { item: InputSelectItem; isChild: boolean }[] = [];
    for (const item of items) {
      flat.push({ item, isChild: false });
      item.childItems?.forEach((child) => flat.push({ item: child, isChild: true }));
    }
    return flat;
  }, [items]);

  const selected = useMemo(() => {
    const normalized = String(value ?? '').toLowerCase();
    return flatItems.find((f) => String(f.item.value).toLowerCase() === normalized)?.item;
  }, [flatItems, value]);

  // Mirror the outside value into the box, but never while the user is typing in it.
  useEffect(() => {
    if (document.activeElement === inputRef.current) return;
    setInputText(selected ? selected.label : String(value ?? ''));
    setSearchTerm('');
  }, [value, selected]);

  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return flatItems;
    return flatItems.filter((f) => f.item.label.toLowerCase().includes(term));
  }, [flatItems, searchTerm]);

  useEffect(() => {
    if (activeIndex < 0) return;
    listRef.current?.querySelector(`[data-index="${activeIndex}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  const handleInput = (text: string) => {
    setInputText(text);
    setSearchTerm(text);
    setActiveIndex(-1);
    setOpen(true);
    onSearchValueChange?.(text);
    if (allowCustomValue) onChange(parseText(text, valueType));
  };

  const handleSelect = (item: InputSelectItem) => {
    const raw = Array.isArray(item.value) ? item.value[0] : item.value;
    onChange(valueType === 'number' ? Number(raw) : raw);
    setInputText(item.label);
    setSearchTerm('');
    setActiveIndex(-1);
    setOpen(false);
  };

  // A typed label snaps to its option; otherwise strict mode rolls the text back to the last valid value.
  const handleBlur = () => {
    const match = flatItems.find((f) => f.item.label.toLowerCase() === inputText.trim().toLowerCase());
    if (match && match.item !== selected) handleSelect(match.item);
    else if (!match && !allowCustomValue) setInputText(selected ? selected.label : '');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!open) {
        setOpen(true);
        setActiveIndex(0);
        return;
      }
      const delta = e.key === 'ArrowDown' ? 1 : -1;
      setActiveIndex((prev) => (filtered.length === 0 ? -1 : (prev + delta + filtered.length) % filtered.length));
    } else if (e.key === 'Enter') {
      if (open && activeIndex >= 0 && filtered[activeIndex]) {
        e.preventDefault();
        handleSelect(filtered[activeIndex].item);
      } else if (open) {
        setOpen(false);
      }
    } else if (e.key === 'Escape' || e.key === 'Tab') {
      setOpen(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <div ref={anchorRef} className="relative w-full">
          <Input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-expanded={open}
            aria-autocomplete="list"
            placeholder={placeholder}
            disabled={disabled}
            value={inputText}
            onChange={(e) => handleInput(e.target.value)}
            onFocus={() => setOpen(true)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className={cn('h-11 w-full pr-8 text-sm', inputClass)}
          />
          <button
            type="button"
            tabIndex={-1}
            disabled={disabled}
            aria-label="Toggle options"
            className="absolute inset-y-0 right-0 flex w-8 items-center justify-center text-muted-foreground disabled:opacity-50"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              setOpen((prev) => !prev);
              inputRef.current?.focus();
            }}
          >
            <CaretSortIcon className="h-4 w-4 opacity-50" />
          </button>
        </div>
      </PopoverAnchor>

      <PopoverContent
        align="start"
        className={cn('mt-0 w-[var(--radix-popover-trigger-width)] p-0', contentClass)}
        onOpenAutoFocus={(e) => e.preventDefault()}
        onInteractOutside={(e) => {
          if (anchorRef.current?.contains(e.target as Node)) e.preventDefault();
        }}
      >
        <div ref={listRef} className="max-h-60 overflow-y-auto p-1" onMouseDown={(e) => e.preventDefault()}>
          {onAddNew && (
            <div
              className="flex cursor-pointer select-none items-center gap-1.5 rounded-sm px-2 py-1.5 text-sm font-medium text-primary hover:bg-accent"
              onClick={() => {
                onAddNew(searchTerm);
                setOpen(false);
              }}
            >
              <PlusCircledIcon className="h-4 w-4" />
              {addNewLabel}
            </div>
          )}

          {detailHeaders && detailHeaders.length > 0 && filtered.length > 0 && (
            <div className="flex items-center px-2 py-1.5">
              <span className="flex-1" />
              {detailHeaders.map((header) => (
                <span key={header} className="w-24 shrink-0 text-right text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {header}
                </span>
              ))}
            </div>
          )}

          {filtered.map((f, index) => {
            const isSelected = selected === f.item;
            return (
              <div
                key={`${f.item.value}-${index}-${containerName}`}
                data-index={index}
                role="option"
                aria-selected={isSelected}
                className={cn(
                  'flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none',
                  f.isChild && 'ps-5',
                  index === activeIndex ? 'bg-accent text-accent-foreground' : 'hover:bg-accent hover:text-accent-foreground'
                )}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => handleSelect(f.item)}
              >
                <span className="min-w-0 flex-1 truncate">{f.item.label}</span>
                {f.item.details?.map((cell, cellIndex) => (
                  <span key={cellIndex} className="w-24 shrink-0 text-right tabular-nums">
                    {cell}
                  </span>
                ))}
                {!detailHeaders && <CheckIcon className={cn('ml-auto h-4 w-4', isSelected ? 'opacity-100' : 'opacity-0')} />}
              </div>
            );
          })}

          {filtered.length === 0 &&
            (addComponent ? (
              <div className="flex cursor-pointer items-center justify-center p-2 text-center text-sm" onClick={() => newRecordValue?.(searchTerm)}>
                <span>
                  Add{' '}
                  <strong className="underline">
                    <em>{searchTerm}</em>
                  </strong>{' '}
                  as new record.
                </span>
              </div>
            ) : (
              <p className="p-2 text-center text-sm text-muted-foreground">No matches found.</p>
            ))}
        </div>

        {addComponent}
      </PopoverContent>
    </Popover>
  );
}
