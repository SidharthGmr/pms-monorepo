'use client';
import { useEffect, useMemo, useState } from 'react';
import { useDebounce } from 'use-debounce';
import { Cross2Icon } from '@radix-ui/react-icons';
import CheckList from '@/components/common/check-list';
import RadioList from '@/components/common/radio-list';
import { Button } from '@/components/ui/button';
import { useGetAllPublicBrandNames } from '@/hooks/service-hooks/useBrandNameService';
import { useGetAllPublicCategories } from '@/hooks/service-hooks/useCategoryService';
import { useGetAllPublicProducts } from '@/hooks/service-hooks/useProductService';

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
  initialCategoryIds?: number[];
  initialBrandNameIds?: number[];
  initialProductIds?: number[];
  initialSort?: string;
  onTextChange?: (q: string) => void;
  onCategoryChange?: (categoryIds: number[]) => void;
  onBrandNameChange?: (brandNameIds: number[]) => void;
  onProductChange?: (productIds: number[]) => void;
  onSortChange?: (sort: string) => void;
  resetForm?: () => void;
}

// Every box is a checkbox list so several values can be combined, and each folds down to its header.
export default function PublicVariantFilter({
  initialSearch = '',
  initialCategoryIds = [],
  initialBrandNameIds = [],
  initialProductIds = [],
  initialSort = DEFAULT_SORT,
  onTextChange,
  onCategoryChange,
  onBrandNameChange,
  onProductChange,
  onSortChange,
  resetForm,
}: PublicVariantFilterProps) {
  const [searchedText, setSearchedText] = useState(initialSearch);
  const [searchedValue] = useDebounce(searchedText, 600);
  const [categoryIds, setCategoryIds] = useState<number[]>(initialCategoryIds);
  const [brandNameIds, setBrandNameIds] = useState<number[]>(initialBrandNameIds);
  const [productIds, setProductIds] = useState<number[]>(initialProductIds);
  const [sort, setSort] = useState(initialSort);
  const [isFiltered, setIsFiltered] = useState(false);

  const { data: categoriesResponse, isLoading: isCategoriesLoading } = useGetAllPublicCategories({ showAllRecords: true });
  const { data: brandResponse, isLoading: isBrandsLoading } = useGetAllPublicBrandNames({ showAllRecords: true });
  const { data: productResponse, isLoading: isProductsLoading } = useGetAllPublicProducts({ showAllRecords: true });

  const categoryItems = useMemo(
    () => (categoriesResponse?.data?.data?.data ?? []).map((category) => ({ label: category.name, value: category.id })),
    [categoriesResponse]
  );
  const brandItems = useMemo(() => (brandResponse?.data?.data?.data ?? []).map((brand) => ({ label: brand.name, value: brand.id })), [brandResponse]);
  const productItems = useMemo(
    () => (productResponse?.data?.data?.data ?? []).map((product) => ({ label: product.name, value: product.id })),
    [productResponse]
  );

  useEffect(() => {
    onTextChange?.(searchedValue.trim());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchedValue]);

  useEffect(() => {
    setIsFiltered(!!searchedText || categoryIds.length > 0 || brandNameIds.length > 0 || productIds.length > 0 || sort !== DEFAULT_SORT);
  }, [searchedText, categoryIds, brandNameIds, productIds, sort]);

  // The product carousel above the list can toggle products too, so the checkbox state follows the parent.
  const productKey = initialProductIds.join(',');
  useEffect(() => {
    setProductIds(productKey ? productKey.split(',').map(Number) : []);
  }, [productKey]);

  const selectCategories = (next: number[]) => {
    setCategoryIds(next);
    onCategoryChange?.(next);
  };

  const selectBrands = (next: number[]) => {
    setBrandNameIds(next);
    onBrandNameChange?.(next);
  };

  const selectProducts = (next: number[]) => {
    setProductIds(next);
    onProductChange?.(next);
  };

  const resetFilter = () => {
    setSearchedText('');
    setCategoryIds([]);
    setBrandNameIds([]);
    setProductIds([]);
    setSort(DEFAULT_SORT);
    setIsFiltered(false);
    resetForm?.();
  };

  return (
    <div className="grid gap-2">
      <CheckList
        title="Category"
        collapsible
        searchable
        searchPlaceholder="Search categories…"
        items={categoryItems}
        values={categoryIds}
        onChange={selectCategories}
        loading={isCategoriesLoading}
        emptyText="No categories yet."
      />
      <CheckList
        title="Brand"
        collapsible
        searchable
        searchPlaceholder="Search brands…"
        items={brandItems}
        values={brandNameIds}
        onChange={selectBrands}
        loading={isBrandsLoading}
        emptyText="No brands yet."
      />
      <CheckList
        title="Product"
        collapsible
        searchable
        searchPlaceholder="Search products…"
        items={productItems}
        values={productIds}
        onChange={selectProducts}
        loading={isProductsLoading}
        emptyText="No products yet."
      />
      <RadioList
        title="Sort by"
        allLabel={null}
        collapsible
        items={SORT_OPTIONS}
        value={sort}
        onChange={(next) => {
          const value = next ?? DEFAULT_SORT;
          setSort(value);
          onSortChange?.(value);
        }}
      />
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
