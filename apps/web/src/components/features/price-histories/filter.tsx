'use client';
import { DateRangePicker } from '@/components/common/date-range-picker';
import { SelectSearch } from '@/components/common/select-search';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useGetAllProducts } from '@/hooks/service-hooks/useProductService';
import { useGetProductVariants } from '@/hooks/service-hooks/useProductVariantService';
import { Cross2Icon } from '@radix-ui/react-icons';
import { Table } from '@tanstack/react-table';
import { DateRange } from 'react-day-picker';
import { useEffect, useMemo, useState } from 'react';
import { useDebounce } from 'use-debounce';

interface PriceHistoryFilterProps<TData> {
  table: Table<TData>;
  /** Set when arriving from a product/variant screen via ?productId=/?variantId=. */
  initialProductId?: number;
  initialVariantId?: number;
  onTextChange?: (q: string) => void;
  onProductChange?: (productId: number | undefined) => void;
  onVariantChange?: (variantId: number | undefined) => void;
  onDateRangeChange?: (startDate: string | undefined, endDate: string | undefined) => void;
  onDirectionChange?: (direction: 'increase' | 'decrease' | undefined) => void;
  resetForm?: () => void;
}

const DIRECTION_ITEMS = [
  { label: 'Increases only', value: 'increase' },
  { label: 'Decreases only', value: 'decrease' },
];

export default function PriceHistoryFilter<TData>({
  table,
  initialProductId,
  initialVariantId,
  onTextChange,
  onProductChange,
  onVariantChange,
  onDateRangeChange,
  onDirectionChange,
  resetForm,
}: PriceHistoryFilterProps<TData>) {
  const [searchedText, setSearchedText] = useState('');
  const [searchedValue] = useDebounce(searchedText, 600);
  const [productId, setProductId] = useState<number | undefined>(initialProductId);
  const [variantId, setVariantId] = useState<number | undefined>(initialVariantId);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [direction, setDirection] = useState<string | undefined>(undefined);
  const [isFiltered, setIsFiltered] = useState(false);

  useEffect(() => {
    // `to` is the start of that day, so push it to the end of it - otherwise a change made
    // at 14:00 on the last day of the range falls outside it.
    const to = dateRange?.to ? new Date(dateRange.to) : undefined;
    if (to) to.setHours(23, 59, 59, 999);
    onDateRangeChange?.(dateRange?.from?.toISOString(), to?.toISOString());
    table.setPageIndex(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange]);

  const { data: productsResponse } = useGetAllProducts({ showAllRecords: true });
  // Variants only exist per product, so this dropdown stays disabled until one is picked.
  const { data: variantsResponse } = useGetProductVariants(productId ?? 0, { recordPerPage: 100 }, !!productId);

  const productItems = useMemo(
    () => (productsResponse?.data?.data?.data ?? []).map((product) => ({ label: product.name, value: product.id })),
    [productsResponse]
  );

  const variantItems = useMemo(
    () =>
      (variantsResponse?.data?.data?.data ?? []).map((variant) => ({
        label: variant.sku ? `${variant.sku}` : `Variant #${variant.id}`,
        value: variant.id,
      })),
    [variantsResponse]
  );

  useEffect(() => {
    onTextChange?.(searchedValue);
    table.setPageIndex(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchedValue]);

  useEffect(() => {
    setIsFiltered(!!searchedText || productId !== undefined || variantId !== undefined || !!dateRange?.from || direction !== undefined);
  }, [searchedText, productId, variantId, dateRange, direction]);

  const resetFilter = () => {
    setSearchedText('');
    setProductId(undefined);
    setVariantId(undefined);
    setDateRange(undefined);
    setDirection(undefined);
    setIsFiltered(false);
    table.setPageIndex(0);
    resetForm?.();
  };

  return (
    <div className="grid grid-cols-1 gap-2 md:grid-cols-3 xl:grid-cols-6">
      <Input
        placeholder="Search reason, SKU or product..."
        value={searchedText}
        onChange={(e) => setSearchedText(e.target.value)}
        className="bg-background"
      />
      <div>
        <SelectSearch
          value={productId}
          placeholder="Filter by product"
          items={productItems}
          valueType="number"
          onChange={(value) => {
            const next = value === '' || value === undefined ? undefined : +value;
            setProductId(next);
            // The old variant belongs to the old product - drop it.
            setVariantId(undefined);
            onVariantChange?.(undefined);
            onProductChange?.(next);
            table.setPageIndex(0);
          }}
          buttonClass="bg-background w-full"
          containerName="price-history-product-filter"
        />
      </div>
      <div>
        <SelectSearch
          value={variantId}
          placeholder={productId ? 'Filter by variant' : 'Pick a product first'}
          items={variantItems}
          valueType="number"
          onChange={(value) => {
            const next = value === '' || value === undefined ? undefined : +value;
            setVariantId(next);
            onVariantChange?.(next);
            table.setPageIndex(0);
          }}
          buttonClass="bg-background w-full"
          containerName="price-history-variant-filter"
        />
      </div>
      <div>
        {/* Filters on `effectiveFrom` - the date a price took force, not the date it was typed. */}
        <DateRangePicker
          mode="range"
          value={dateRange}
          selected={dateRange}
          onSelect={setDateRange}
          numberOfMonthsToShow={2}
          placeholder="Effective between"
          buttonClass="bg-background w-full"
        />
      </div>
      <div>
        <SelectSearch
          value={direction}
          placeholder="Any change"
          items={DIRECTION_ITEMS}
          valueType="string"
          disableSearch
          onChange={(value) => {
            const next = value === '' || value === undefined ? undefined : String(value);
            setDirection(next);
            onDirectionChange?.(next as 'increase' | 'decrease' | undefined);
            table.setPageIndex(0);
          }}
          buttonClass="bg-background w-full"
          containerName="price-history-direction-filter"
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
