'use client';
import { SelectSearch } from '@/components/common/select-search';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatusValues } from '@/enums/status-values.enum';
import { Cross2Icon } from '@radix-ui/react-icons';
import { Table } from '@tanstack/react-table';
import { useEffect, useState } from 'react';
import { useDebounce } from 'use-debounce';

interface ReviewFilterProps<TData> {
  table: Table<TData>;
  onTextChange?: (q: string) => void;
  onStatusChange?: (value: string) => void;
  onRatingChange?: (rating: number | undefined) => void;
  onVerifiedChange?: (isVerified: boolean | undefined) => void;
  resetForm?: () => void;
}

export default function ReviewFilter<TData>({
  table,
  onTextChange,
  onStatusChange,
  onRatingChange,
  onVerifiedChange,
  resetForm,
}: ReviewFilterProps<TData>) {
  const [searchedText, setSearchedText] = useState('');
  const [searchedValue] = useDebounce(searchedText, 600);
  const [status, setStatus] = useState<string>('');
  const [rating, setRating] = useState<number | undefined>(undefined);
  const [verified, setVerified] = useState<string>('');
  const [isFiltered, setIsFiltered] = useState(false);

  useEffect(() => {
    onTextChange?.(searchedValue);
    table.setPageIndex(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchedValue]);

  useEffect(() => {
    setIsFiltered(!!searchedText || !!status || rating !== undefined || !!verified);
  }, [searchedText, status, rating, verified]);

  const resetFilter = () => {
    setSearchedText('');
    setStatus('');
    setRating(undefined);
    setVerified('');
    setIsFiltered(false);
    table.setPageIndex(0);
    resetForm?.();
  };

  return (
    <div className="grid grid-cols-1 gap-2 md:grid-cols-5">
      <Input
        placeholder="Search review, product or reviewer..."
        value={searchedText}
        onChange={(e) => setSearchedText(e.target.value)}
        className="bg-background"
      />
      <div>
        <SelectSearch
          value={status}
          placeholder="Filter by status"
          items={[
            { label: 'Published', value: StatusValues.Published },
            { label: 'Draft', value: StatusValues.Draft },
            { label: 'Trash', value: StatusValues.Trash },
          ]}
          valueType="string"
          onChange={(value) => {
            setStatus(value as string);
            onStatusChange?.(value as string);
            table.setPageIndex(0);
          }}
          buttonClass="bg-background w-full"
          containerName="review-status-filter"
          disableSearch
        />
      </div>
      <div>
        <SelectSearch
          value={rating}
          placeholder="Filter by rating"
          items={[5, 4, 3, 2, 1].map((star) => ({ label: `${star} star${star > 1 ? 's' : ''}`, value: star }))}
          valueType="number"
          onChange={(value) => {
            const next = value === '' || value === undefined ? undefined : +value;
            setRating(next);
            onRatingChange?.(next);
            table.setPageIndex(0);
          }}
          buttonClass="bg-background w-full"
          containerName="review-rating-filter"
          disableSearch
        />
      </div>
      <div>
        <SelectSearch
          value={verified}
          placeholder="Verified purchase"
          items={[
            { label: 'Verified only', value: 'true' },
            { label: 'Unverified only', value: 'false' },
          ]}
          valueType="string"
          onChange={(value) => {
            const next = value as string;
            setVerified(next);
            onVerifiedChange?.(next === '' ? undefined : next === 'true');
            table.setPageIndex(0);
          }}
          buttonClass="bg-background w-full"
          containerName="review-verified-filter"
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
