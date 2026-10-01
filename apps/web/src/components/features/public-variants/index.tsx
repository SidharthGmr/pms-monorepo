'use client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import config from '@/config';
import { useGetAllPublicProductVariants } from '@/hooks/service-hooks/useProductVariantService';
import { ProductVariantFilterParams } from '@/params/product-variant.params';
import { ChevronLeft, ChevronRight, Package, PackageX } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import PublicVariantFilter, { DEFAULT_SORT } from './filter';
import VariantCard, { VariantCardSkeleton } from './variant-card';
import { ProductVariantListItemDto } from '@pms/types';

// The API takes comma-separated ids; the checkbox lists work with arrays.
const toIds = (csv?: string): number[] =>
  csv
    ? csv
        .split(',')
        .map(Number)
        .filter((n) => Number.isInteger(n) && n > 0)
    : [];

export default function PublicVariantList() {
  const searchParams = useSearchParams();

  const [data, setData] = useState<ProductVariantListItemDto[]>([]);
  const [recordCount, setRecordCount] = useState<number>(0);

  const [filterParams, setFilterParams] = useState<ProductVariantFilterParams>({
    search: searchParams.get('search') || '',
    categoryIds: searchParams.get('categoryIds') || searchParams.get('categoryId') || undefined,
    brandNameIds: searchParams.get('brandNameIds') || searchParams.get('brandNameId') || undefined,
    productIds: searchParams.get('productIds') || searchParams.get('productId') || undefined,
    page: +(searchParams.get('page') || 1),
    recordPerPage: +(searchParams.get('recordPerPage') || config.recordPerPage),
    sortBy: searchParams.get('sortBy') || 'createdAt',
    sortDirection: searchParams.get('sortDirection') || 'DESC',
  });

  //const getAllPublicVariantsResponse = useGetAllPublicProductVariants(filterParams);

  const getAllProductVariantsResponse = useGetAllPublicProductVariants({ ...filterParams }, true);

  useEffect(() => {
    if (getAllProductVariantsResponse.status === 'success' && getAllProductVariantsResponse.data?.data?.data?.data) {
      setData(getAllProductVariantsResponse.data?.data?.data?.data);
      setRecordCount(getAllProductVariantsResponse.data?.data?.data?.totalRecord);
    }
  }, [getAllProductVariantsResponse.status, getAllProductVariantsResponse.data]);

  const page = filterParams.page ?? 1;
  const pageSize = filterParams.recordPerPage || config.recordPerPage;
  const pageCount = Math.max(1, Math.ceil(recordCount / pageSize));
  const hasFilters = !!filterParams.search || !!filterParams.categoryIds || !!filterParams.brandNameIds || !!filterParams.productIds;

  const resetForm = () => {
    setFilterParams({
      search: '',
      categoryIds: undefined,
      brandNameIds: undefined,
      productIds: undefined,
      page: 1,
      recordPerPage: config.recordPerPage,
      sortBy: 'createdAt',
      sortDirection: 'DESC',
    });
  };

  if (getAllProductVariantsResponse.isError) {
    return (
      <Card>
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <PackageX className="h-8 w-8 text-destructive/70" />
          <p className="text-sm text-muted-foreground">Could not load variants right now.</p>
          <Button type="button" variant="outline" size="sm" onClick={() => getAllProductVariantsResponse.refetch()}>
            Try again
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-5">
        <div className="w-1/4">
          <PublicVariantFilter
            initialSearch={filterParams.search}
            initialCategoryIds={toIds(filterParams.categoryIds)}
            initialBrandNameIds={toIds(filterParams.brandNameIds)}
            initialProductIds={toIds(filterParams.productIds)}
            initialSort={filterParams.sortBy && filterParams.sortDirection ? `${filterParams.sortBy}:${filterParams.sortDirection}` : DEFAULT_SORT}
            resetForm={resetForm}
            onTextChange={(value) => setFilterParams((prev) => ({ ...prev, search: value || '', page: 1 }))}
            onCategoryChange={(ids) => setFilterParams((prev) => ({ ...prev, categoryIds: ids.join(',') || undefined, page: 1 }))}
            onBrandNameChange={(ids) => setFilterParams((prev) => ({ ...prev, brandNameIds: ids.join(',') || undefined, page: 1 }))}
            onProductChange={(ids) => setFilterParams((prev) => ({ ...prev, productIds: ids.join(',') || undefined, page: 1 }))}
            onSortChange={(sort) => {
              const [sortBy, sortDirection] = sort.split(':');
              setFilterParams((prev) => ({ ...prev, sortBy, sortDirection, page: 1 }));
            }}
          />
        </div>
        <div className="w-3/4">
          {/* <div className="text-sm text-muted-foreground">
            {getAllProductVariantsResponse.isLoading
              ? 'Loading…'
              : totalRecord === 0
                ? 'No variants'
                : `${totalRecord} variant${totalRecord === 1 ? '' : 's'}`}
            {getAllProductVariantsResponse.isFetching && !getAllProductVariantsResponse.isLoading && (
              <span className="ml-2 text-xs">(updating…)</span>
            )}
          </div> */}

          {getAllProductVariantsResponse.isLoading && 'Loading…'}
          {getAllProductVariantsResponse.isFetching && !getAllProductVariantsResponse.isLoading && (
            <>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {Array.from({ length: pageSize }, (_, i) => (
                  <VariantCardSkeleton key={i} />
                ))}
              </div>
            </>
          )}
          {data.length === 0 ? (
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
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {data.map((variant) => (
                  <VariantCard key={variant.id} variant={variant} />
                ))}
              </div>

              {pageCount > 1 && (
                <div className="flex items-center justify-center gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={page <= 1 || getAllProductVariantsResponse.isFetching}
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
                    disabled={page >= pageCount || getAllProductVariantsResponse.isFetching}
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
      </div>
    </div>
  );
}
