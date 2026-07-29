'use client';
import { SelectSearch } from '@/components/common/select-search';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useGetAllProducts } from '@/hooks/service-hooks/useProductService';
import { useGetProductVariants } from '@/hooks/service-hooks/useProductVariantService';
import { Cross2Icon } from '@radix-ui/react-icons';
import { Table } from '@tanstack/react-table';
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
  resetForm?: () => void;
}

export default function PriceHistoryFilter<TData>({
  table,
  initialProductId,
  initialVariantId,
  onTextChange,
  onProductChange,
  onVariantChange,
  resetForm,
}: PriceHistoryFilterProps<TData>) {
  const [searchedText, setSearchedText] = useState('');
  const [searchedValue] = useDebounce(searchedText, 600);
  const [productId, setProductId] = useState<number | undefined>(initialProductId);
  const [variantId, setVariantId] = useState<number | undefined>(initialVariantId);
  const [isFiltered, setIsFiltered] = useState(false);

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
    setIsFiltered(!!searchedText || productId !== undefined || variantId !== undefined);
  }, [searchedText, productId, variantId]);

  const resetFilter = () => {
    setSearchedText('');
    setProductId(undefined);
    setVariantId(undefined);
    setIsFiltered(false);
    table.setPageIndex(0);
    resetForm?.();
  };

  return (
    <div className="grid grid-cols-1 gap-2 md:grid-cols-4">
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
