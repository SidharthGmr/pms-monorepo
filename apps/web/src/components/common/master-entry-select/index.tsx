'use client';

import { SelectSearch } from '@/components/common/select-search';
import DropdownBasicDto from '@/dtos/dropdown-basic.dto';
import { MasterEntryDto } from '@/dtos/master-entry.dto';
import { useMasterEntriesByCode } from '@/hooks/service-hooks/useMasterEntryService';
import { useMemo } from 'react';

interface MasterEntrySelectProps {
  /** Stable code of the master attribute whose values fill this dropdown, e.g. "SIZE". */
  attributeCode: string;
  value?: string | number;
  onChange: (value: string | number) => void;
  /** Which field the form stores. `value` ("L") is the default; `id` when you need the row. */
  bindTo?: 'value' | 'id';
  placeholder?: string;
  buttonClass?: string;
  disableSearch?: boolean;
  /** Renders a colour dot beside entries that define `colorHex`. */
  showColorSwatch?: boolean;
  /** Receives the resolved entries, e.g. to read a unit or metadata alongside the value. */
  onEntriesLoaded?: (entries: MasterEntryDto[]) => void;
}

/**
 * Dropdown backed by master data instead of a hard-coded list. Point it at an attribute
 * code and it renders that attribute's published values in display order:
 *
 *   <MasterEntrySelect attributeCode="SIZE" value={size} onChange={setSize} />
 *
 * Adding a new size later is a data change in Master Entries, not a code change.
 */
export default function MasterEntrySelect({
  attributeCode,
  value,
  onChange,
  bindTo = 'value',
  placeholder,
  buttonClass,
  disableSearch,
  showColorSwatch = false,
  onEntriesLoaded,
}: MasterEntrySelectProps) {
  const { data: response, isLoading } = useMasterEntriesByCode(attributeCode);
  const entries = useMemo(() => response?.data?.data?.data ?? [], [response]);

  const items: DropdownBasicDto[] = useMemo(() => {
    onEntriesLoaded?.(entries);
    return entries.map((entry) => ({
      // The swatch is a text prefix so this stays compatible with SelectSearch's
      // label rendering rather than needing a custom item renderer.
      label: showColorSwatch && entry.colorHex ? `● ${entry.name}` : entry.name,
      value: bindTo === 'id' ? entry.id : entry.value,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries, bindTo, showColorSwatch]);

  return (
    <SelectSearch
      items={items}
      value={value}
      valueType={bindTo === 'id' ? 'number' : 'string'}
      onChange={onChange}
      placeholder={isLoading ? 'Loading...' : (placeholder ?? `Select ${attributeCode.toLowerCase()}`)}
      buttonClass={buttonClass}
      containerName={`master-entry-${attributeCode.toLowerCase()}`}
      disableSearch={disableSearch ?? entries.length <= 8}
    />
  );
}
