'use client';
import { SelectSearch } from '@/components/common/select-search';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useGetAllCategories } from '@/hooks/service-hooks/useCategoryService';
import { useGetAllProducts } from '@/hooks/service-hooks/useProductService';
import { Cross2Icon } from '@radix-ui/react-icons';
import { useEffect, useMemo, useState } from 'react';
import { useDebounce } from 'use-debounce';

/** Only the columns the API can sort on - price and stock are derived, so they are not offered. */
export const SORT_OPTIONS = [
  { label: 'Newest first', value: 'createdAt:DESC' },
  { label: 'Oldest first', value: 'createdAt:ASC' },
  { label: 'Name A–Z', value: 'name:ASC' },
  { label: 'Name Z–A', value: 'name:DESC' },
  { label: 'SKU A–Z', value: 'sku:ASC' },
];

export const DEFAULT_SORT = SORT_OPTIONS[0].value;

interface PublicVariantFilterProps {
  /** Seeded from the URL so a shared link opens with its filters applied. */
  initialSearch?: string;
  initialCategoryId?: number;
  initialProductId?: number;
  initialSort?: string;
  onTextChange?: (q: string) => void;
  onCategoryChange?: (categoryId: number | undefined) => void;
  onProductChange?: (productId: number | undefined) => void;
  onSortChange?: (sort: string) => void;
  resetForm?: () => void;
}

export default function PublicVariantFilter({
  initialSearch = '',
  initialCategoryId,
  initialProductId,
  initialSort = DEFAULT_SORT,
  onTextChange,
  onCategoryChange,
  onProductChange,
  onSortChange,
  resetForm,
}: PublicVariantFilterProps) {
  const [searchedText, setSearchedText] = useState(initialSearch);
  const [searchedValue] = useDebounce(searchedText, 600);
  const [categoryId, setCategoryId] = useState<number | undefined>(initialCategoryId);
  const [productId, setProductId] = useState<number | undefined>(initialProductId);
  const [sort, setSort] = useState(initialSort);
  const [isFiltered, setIsFiltered] = useState(false);

  const { data: categoriesResponse } = useGetAllCategories({ showAllRecords: true });
  const { data: productResponse } = useGetAllProducts({ showAllRecords: true });

  const categoryItems = useMemo(
    () => (categoriesResponse?.data?.data?.data ?? []).map((category) => ({ label: category.name, value: category.id })),
    [categoriesResponse]
  );
  const productItems = useMemo(
    () => (productResponse?.data?.data?.data ?? []).map((product) => ({ label: product.name, value: product.id })),
    [productResponse]
  );

  useEffect(() => {
    onTextChange?.(searchedValue.trim());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchedValue]);

  useEffect(() => {
    setIsFiltered(!!searchedText || categoryId !== undefined || productId !== undefined || sort !== DEFAULT_SORT);
  }, [searchedText, categoryId, productId, sort]);

  const resetFilter = () => {
    setSearchedText('');
    setCategoryId(undefined);
    setProductId(undefined);
    setSort(DEFAULT_SORT);
    setIsFiltered(false);
    resetForm?.();
  };

  return (
    <div className="grid grid-cols-1 gap-2 md:grid-cols-3 lg:grid-cols-5">
      <Input
        placeholder="Search product, variant, SKU or barcode..."
        value={searchedText}
        onChange={(e) => setSearchedText(e.target.value)}
        className="bg-background"
        aria-label="Search variants"
      />
      <div>
        <SelectSearch
          value={categoryId}
          placeholder="All categories"
          items={categoryItems}
          valueType="number"
          onChange={(value) => {
            const next = value === '' || value === undefined ? undefined : +value;
            setCategoryId(next);
            onCategoryChange?.(next);
          }}
          buttonClass="bg-background w-full"
          containerName="public-variant-category-filter"
        />
      </div>
      <div>
        <SelectSearch
          value={productId}
          placeholder="All products"
          items={productItems}
          valueType="number"
          onChange={(value) => {
            const next = value === '' || value === undefined ? undefined : +value;
            setProductId(next);
            onProductChange?.(next);
          }}
          buttonClass="bg-background w-full"
          containerName="public-variant-product-filter"
        />
      </div>
      <div>
        <SelectSearch
          value={sort}
          placeholder="Sort"
          items={SORT_OPTIONS}
          valueType="string"
          disableSearch
          onChange={(value) => {
            const next = value ? String(value) : DEFAULT_SORT;
            setSort(next);
            onSortChange?.(next);
          }}
          buttonClass="bg-background w-full"
          containerName="public-variant-sort-filter"
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
