'use client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import config from '@/config';
import { useGetAllPublicProductVariants } from '@/hooks/service-hooks/useProductVariantService';
import { ProductVariantFilterParams } from '@/params/product-variant.params';
import { ChevronLeft, ChevronRight, Package, PackageX } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import PublicVariantFilter, { DEFAULT_SORT } from './filter';
import VariantCard, { VariantCardSkeleton } from './variant-card';

export default function PublicVariantList() {
  const searchParams = useSearchParams();

  const [filterParams, setFilterParams] = useState<ProductVariantFilterParams>({
    search: searchParams.get('search') || '',
    categoryId: searchParams.get('categoryId') ? +searchParams.get('categoryId')! : undefined,
    productId: searchParams.get('productId') ? +searchParams.get('productId')! : undefined,
    page: +(searchParams.get('page') || 1),
    recordPerPage: +(searchParams.get('recordPerPage') || config.recordPerPage),
    sortBy: searchParams.get('sortBy') || 'createdAt',
    sortDirection: searchParams.get('sortDirection') || 'DESC',
  });

  const getAllPublicVariantsResponse = useGetAllPublicProductVariants(filterParams);
  const variants = getAllPublicVariantsResponse.data?.data?.data?.data ?? [];
  const totalRecord = getAllPublicVariantsResponse.data?.data?.data?.totalRecord ?? 0;

  const page = filterParams.page ?? 1;
  const pageSize = filterParams.recordPerPage || config.recordPerPage;
  const pageCount = Math.max(1, Math.ceil(totalRecord / pageSize));
  const hasFilters = !!filterParams.search || filterParams.categoryId !== undefined || filterParams.productId !== undefined;

  const resetForm = () => {
    setFilterParams({
      search: '',
      categoryId: undefined,
      productId: undefined,
      page: 1,
      recordPerPage: config.recordPerPage,
      sortBy: 'createdAt',
      sortDirection: 'DESC',
    });
  };

  if (getAllPublicVariantsResponse.isLoading) {
    return (
      <>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: pageSize }, (_, i) => (
            <VariantCardSkeleton key={i} />
          ))}
        </div>
      </>
    );
  }

  if (getAllPublicVariantsResponse.isError) {
    return (
      <Card>
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <PackageX className="h-8 w-8 text-destructive/70" />
          <p className="text-sm text-muted-foreground">Could not load variants right now.</p>
          <Button type="button" variant="outline" size="sm" onClick={() => getAllPublicVariantsResponse.refetch()}>
            Try again
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <PublicVariantFilter
        initialSearch={filterParams.search}
        initialCategoryId={filterParams.categoryId}
        initialProductId={filterParams.productId}
        initialSort={filterParams.sortBy && filterParams.sortDirection ? `${filterParams.sortBy}:${filterParams.sortDirection}` : DEFAULT_SORT}
        resetForm={resetForm}
        onTextChange={(value) => setFilterParams((prev) => ({ ...prev, search: value || '', page: 1 }))}
        onCategoryChange={(categoryId) => setFilterParams((prev) => ({ ...prev, categoryId, page: 1 }))}
        onProductChange={(productId) => setFilterParams((prev) => ({ ...prev, productId, page: 1 }))}
        onSortChange={(sort) => {
          const [sortBy, sortDirection] = sort.split(':');
          setFilterParams((prev) => ({ ...prev, sortBy, sortDirection, page: 1 }));
        }}
      />

      <div className="text-sm text-muted-foreground">
        {getAllPublicVariantsResponse.isLoading
          ? 'Loading…'
          : totalRecord === 0
            ? 'No variants'
            : `${totalRecord} variant${totalRecord === 1 ? '' : 's'}`}
        {getAllPublicVariantsResponse.isFetching && !getAllPublicVariantsResponse.isLoading && <span className="ml-2 text-xs">(updating…)</span>}
      </div>

      {variants.length === 0 ? (
        <Card>
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <span className="rounded-full bg-primary/10 p-3 text-primary">
              <Package className="h-5 w-5" />
            </span>
            <div className="space-y-1">
              <p className="font-medium">{hasFilters ? 'Nothing matches those filters' : 'No variants available yet'}</p>
              <p className="text-sm text-muted-foreground">
                {hasFilters ? 'Try a different search, product or category.' : 'Check back soon — new products are on their way.'}
              </p>
            </div>
          </div>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {variants.map((variant) => (
              <VariantCard key={variant.id} variant={variant} />
            ))}
          </div>

          {pageCount > 1 && (
            <div className="flex items-center justify-center gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page <= 1 || getAllPublicVariantsResponse.isFetching}
                onClick={() => setFilterParams((prev) => ({ ...prev, page: page - 1 }))}
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                Previous
              </Button>
              <Badge variant="zinc" className="font-normal">
                Page {page} of {pageCount}
              </Badge>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page >= pageCount || getAllPublicVariantsResponse.isFetching}
                onClick={() => setFilterParams((prev) => ({ ...prev, page: page + 1 }))}
              >
                Next
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
