'use client';
import { SelectSearch } from '@/components/common/select-search';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Roles } from '@/enums/roles.enum';
import { useGetAllProducts } from '@/hooks/service-hooks/useProductService';
import { useGetAllUserList } from '@/hooks/service-hooks/useUserList.service.hook';
import { Cross2Icon } from '@radix-ui/react-icons';
import { Table } from '@tanstack/react-table';
import { useEffect, useMemo, useState } from 'react';
import { useDebounce } from 'use-debounce';

interface WishlistFilterProps<TData> {
  table: Table<TData>;
  onTextChange?: (q: string) => void;
  onCustomerChange?: (userId: string | undefined) => void;
  onProductChange?: (productId: number | undefined) => void;
  resetForm?: () => void;
}

export default function WishlistFilter<TData>({ table, onTextChange, onCustomerChange, onProductChange, resetForm }: WishlistFilterProps<TData>) {
  const [searchedText, setSearchedText] = useState('');
  const [searchedValue] = useDebounce(searchedText, 600);
  const [userId, setUserId] = useState<string>('');
  const [productId, setProductId] = useState<number | undefined>(undefined);
  const [isFiltered, setIsFiltered] = useState(false);

  const { data: customersResponse } = useGetAllUserList({ role: Roles.USER, showAllRecords: true });
  const { data: productsResponse } = useGetAllProducts({ showAllRecords: true });

  const customerItems = useMemo(
    () =>
      (customersResponse?.data?.data?.data || [])
        .map((customer) => {
          // The users API returns the GUID under `userId`; the DTO labels it
          // `usersId`, so read both defensively (same as the POS screen).
          const id = ((customer as any).userId ?? (customer as any).usersId ?? '') as string;
          return { label: customer.email ? `${customer.name} (${customer.email})` : customer.name, value: id };
        })
        .filter((option) => option.value),
    [customersResponse]
  );

  const productItems = useMemo(
    () => (productsResponse?.data?.data?.data ?? []).map((product) => ({ label: product.name, value: product.id })),
    [productsResponse]
  );

  useEffect(() => {
    onTextChange?.(searchedValue);
    table.setPageIndex(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchedValue]);

  useEffect(() => {
    setIsFiltered(!!searchedText || !!userId || productId !== undefined);
  }, [searchedText, userId, productId]);

  const resetFilter = () => {
    setSearchedText('');
    setUserId('');
    setProductId(undefined);
    setIsFiltered(false);
    table.setPageIndex(0);
    resetForm?.();
  };

  return (
    <div className="grid grid-cols-1 gap-2 md:grid-cols-4">
      <Input
        placeholder="Search product name..."
        value={searchedText}
        onChange={(e) => setSearchedText(e.target.value)}
        className="bg-background"
      />
      <div>
        <SelectSearch
          value={userId}
          placeholder="Filter by customer"
          items={customerItems}
          valueType="string"
          onChange={(value) => {
            const next = value ? String(value) : '';
            setUserId(next);
            onCustomerChange?.(next || undefined);
            table.setPageIndex(0);
          }}
          buttonClass="bg-background w-full"
          containerName="wishlist-customer-filter"
        />
      </div>
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
          containerName="wishlist-product-filter"
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
