'use client';
import { SelectSearch } from '@/components/common/select-search';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatusValues } from '@/enums/status-values.enum';
import { useGetAllMasterAttributes } from '@/hooks/service-hooks/useMasterEntryService';
import { Cross2Icon } from '@radix-ui/react-icons';
import { Table } from '@tanstack/react-table';
import { useEffect, useMemo, useState } from 'react';
import { useDebounce } from 'use-debounce';

interface MasterEntryFilterProps<TData> {
  table: Table<TData>;
  /** Set when arriving from the attributes screen via ?attributeId=... */
  initialAttributeId?: number;
  onTextChange?: (q: string) => void;
  onAttributeChange?: (attributeId: number | undefined) => void;
  onStatusChange?: (value: string) => void;
  resetForm?: () => void;
}

export default function MasterEntryFilter<TData>({
  table,
  initialAttributeId,
  onTextChange,
  onAttributeChange,
  onStatusChange,
  resetForm,
}: MasterEntryFilterProps<TData>) {
  const [searchedText, setSearchedText] = useState('');
  const [searchedValue] = useDebounce(searchedText, 600);
  const [attributeId, setAttributeId] = useState<number | undefined>(initialAttributeId);
  const [status, setStatus] = useState<string>('');
  const [isFiltered, setIsFiltered] = useState(false);

  // Every attribute, unpaginated - this feeds the "filter by attribute" dropdown.
  const { data: attributesResponse } = useGetAllMasterAttributes({ showAllRecords: true, status: StatusValues.Published });

  const attributeItems = useMemo(
    () => (attributesResponse?.data?.data?.data ?? []).map((attribute) => ({ label: attribute.name, value: attribute.id })),
    [attributesResponse]
  );

  useEffect(() => {
    onTextChange?.(searchedValue);
    table.setPageIndex(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchedValue]);

  useEffect(() => {
    setIsFiltered(!!searchedText || !!status || attributeId !== undefined);
  }, [searchedText, status, attributeId]);

  const resetFilter = () => {
    setSearchedText('');
    setStatus('');
    setAttributeId(undefined);
    setIsFiltered(false);
    table.setPageIndex(0);
    resetForm?.();
  };

  return (
    <div className="grid grid-cols-1 gap-2 md:grid-cols-4">
      <Input
        placeholder="Search label or value..."
        value={searchedText}
        onChange={(e) => setSearchedText(e.target.value)}
        className="bg-background"
      />
      <div>
        <SelectSearch
          value={attributeId}
          placeholder="Filter by attribute"
          items={attributeItems}
          valueType="number"
          onChange={(value) => {
            const next = value === '' || value === undefined ? undefined : +value;
            setAttributeId(next);
            onAttributeChange?.(next);
            table.setPageIndex(0);
          }}
          buttonClass="bg-background"
          containerName="master-entry-attribute-filter"
        />
      </div>
      <div>
        <SelectSearch
          value={status}
          placeholder="Filter by status"
          items={[
            { label: 'Published', value: StatusValues.Published },
            { label: 'Draft', value: StatusValues.Draft },
          ]}
          valueType="string"
          onChange={(value) => {
            setStatus(value as string);
            onStatusChange?.(value as string);
            table.setPageIndex(0);
          }}
          buttonClass="bg-background"
          containerName="master-entry-status-filter"
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
