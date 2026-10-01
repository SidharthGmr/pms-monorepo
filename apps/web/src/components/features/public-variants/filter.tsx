'use client';
import { SelectSearch } from '@/components/common/select-search';
import { Button } from '@/components/ui/button';
import { useGetAllCategories } from '@/hooks/service-hooks/useCategoryService';
import { useGetAllPublicProducts } from '@/hooks/service-hooks/useProductService';
import RadioList from '@/components/common/radio-list';
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

  const { data: categoriesResponse, isLoading: isCategoriesLoading } = useGetAllCategories({ showAllRecords: true });
  const { data: productResponse, isLoading: isProductsLoading } = useGetAllPublicProducts({ showAllRecords: true });

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

  const selectCategory = (next: number | undefined) => {
    setCategoryId(next);
    onCategoryChange?.(next);
  };

  const selectProduct = (next: number | undefined) => {
    setProductId(next);
    onProductChange?.(next);
  };

  const resetFilter = () => {
    setSearchedText('');
    setCategoryId(undefined);
    setProductId(undefined);
    setSort(DEFAULT_SORT);
    setIsFiltered(false);
    resetForm?.();
  };

  return (
    <div className="grid gap-2">
      {/* <Input
        placeholder="Search product, variant, SKU or barcode..."
        value={searchedText}
        onChange={(e) => setSearchedText(e.target.value)}
        className="bg-background"
        aria-label="Search variants"
      /> */}
      <RadioList
        title="Category"
        allLabel="All categories"
        searchable
        searchPlaceholder="Search categories…"
        items={categoryItems}
        value={categoryId}
        onChange={selectCategory}
        loading={isCategoriesLoading}
        emptyText="No categories yet."
      />
      <RadioList
        title="Product"
        allLabel="All products"
        searchable
        searchPlaceholder="Search products…"
        items={productItems}
        value={productId}
        onChange={selectProduct}
        loading={isProductsLoading}
        emptyText="No products yet."
      />
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
