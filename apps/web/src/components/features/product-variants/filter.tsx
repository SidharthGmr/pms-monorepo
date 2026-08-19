'use client';
import { SelectSearch } from '@/components/common/select-search';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useGetAllCategories } from '@/hooks/service-hooks/useCategoryService';
import { useGetAllProducts } from '@/hooks/service-hooks/useProductService';
import { Cross2Icon } from '@radix-ui/react-icons';
import { Table } from '@tanstack/react-table';
import { useEffect, useMemo, useState } from 'react';
import { useDebounce } from 'use-debounce';

interface ProductVariantFilterProps<TData> {
  table: Table<TData>;
  /** Set when arriving from a product screen via ?productId=. */
  initialProductId?: number;
  onTextChange?: (q: string) => void;
  onProductChange?: (productId: number | undefined) => void;
  onCategoryChange?: (categoryId: number | undefined) => void;
  onActiveChange?: (isActive: boolean | undefined) => void;
  resetForm?: () => void;
}

const ACTIVE_ITEMS = [
  { label: 'Active only', value: 'true' },
  { label: 'Retired only', value: 'false' },
];

export default function ProductVariantFilter<TData>({
  table,
  initialProductId,
  onTextChange,
  onProductChange,
  onCategoryChange,
  onActiveChange,
  resetForm,
}: ProductVariantFilterProps<TData>) {
  const [searchedText, setSearchedText] = useState('');
  const [searchedValue] = useDebounce(searchedText, 600);
  const [productId, setProductId] = useState<number | undefined>(initialProductId);
  const [categoryId, setCategoryId] = useState<number | undefined>(undefined);
  const [active, setActive] = useState<string | undefined>(undefined);
  const [isFiltered, setIsFiltered] = useState(false);

  // `showAllRecords` matters here - without it these lists stop at the first ten records.
  const { data: productsResponse } = useGetAllProducts({ showAllRecords: true });
  const { data: categoriesResponse } = useGetAllCategories({ showAllRecords: true });

  const productItems = useMemo(
    () => (productsResponse?.data?.data?.data ?? []).map((product) => ({ label: product.name, value: product.id })),
    [productsResponse]
  );

  const categoryItems = useMemo(
    () => (categoriesResponse?.data?.data?.data ?? []).map((category) => ({ label: category.name, value: category.id })),
    [categoriesResponse]
  );

  useEffect(() => {
    onTextChange?.(searchedValue);
    table.setPageIndex(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchedValue]);

  useEffect(() => {
    setIsFiltered(!!searchedText || productId !== undefined || categoryId !== undefined || active !== undefined);
  }, [searchedText, productId, categoryId, active]);

  const resetFilter = () => {
    setSearchedText('');
    setProductId(undefined);
    setCategoryId(undefined);
    setActive(undefined);
    setIsFiltered(false);
    table.setPageIndex(0);
    resetForm?.();
  };

  return (
    <div className="grid grid-cols-1 gap-2 md:grid-cols-5">
      <Input
        placeholder="Search SKU, barcode or product..."
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
            onProductChange?.(next);
            table.setPageIndex(0);
          }}
          buttonClass="bg-background w-full"
          containerName="variant-product-filter"
        />
      </div>
      <div>
        <SelectSearch
          value={categoryId}
          placeholder="Filter by category"
          items={categoryItems}
          valueType="number"
          onChange={(value) => {
            const next = value === '' || value === undefined ? undefined : +value;
            setCategoryId(next);
            onCategoryChange?.(next);
            table.setPageIndex(0);
          }}
          buttonClass="bg-background w-full"
          containerName="variant-category-filter"
        />
      </div>
      <div>
        <SelectSearch
          value={active}
          placeholder="Any status"
          items={ACTIVE_ITEMS}
          valueType="string"
          disableSearch
          onChange={(value) => {
            const next = value === '' || value === undefined ? undefined : String(value);
            setActive(next);
            onActiveChange?.(next === undefined ? undefined : next === 'true');
            table.setPageIndex(0);
          }}
          buttonClass="bg-background w-full"
          containerName="variant-active-filter"
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
