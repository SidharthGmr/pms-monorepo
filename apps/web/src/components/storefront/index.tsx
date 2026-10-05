'use client';

import config from '@/config';
import { ProductVariantListItemDto } from '@/dtos/product-variant.dto';
import { useGetAllPublicProductVariants } from '@/hooks/service-hooks/useProductVariantService';
import { ProductVariantFilterParams } from '@/params/product-variant.params';
import { useEffect, useMemo, useState } from 'react';
import { useDebounce } from 'use-debounce';
import PublicVariantList from '../features/public-variants';
import Blog from './sections/Blog';
import Brands from './sections/Brands';
import FeaturedProducts from './sections/FeaturedProducts';
import Footer from './sections/Footer';
import Header from './sections/Header';
import Newsletter from './sections/Newsletter';
import Testimonials from './sections/Testimonials';
import UtilityBar from './sections/UtilityBar';
import WidePromo from './sections/WidePromo';
import { SORT_OPTIONS } from './theme.config';

/**
 * The storefront skin. Sections are presentational and read their copy from `theme.config.ts`;
 * only this file talks to the API, so rebranding never means touching a data hook.
 */
export default function Storefront() {
  const [searchText, setSearchText] = useState('');
  const [debouncedSearch] = useDebounce(searchText, 600);
  const [page, setPage] = useState(1);
  const [, setVariants] = useState<ProductVariantListItemDto[]>([]);

  // The storefront lists sellable SKUs, not products: a 64GB and a 128GB phone are different
  // things to buy, at different prices. Paging happens over variants so the counts are real.
  const filterParams: ProductVariantFilterParams = useMemo(() => {
    const sort = SORT_OPTIONS[0];
    return {
      ...(debouncedSearch ? { search: debouncedSearch } : {}),
      page,
      recordPerPage: config.recordPerPage,
      sortBy: sort.sortBy,
      sortDirection: sort.sortOrder,
    };
  }, [debouncedSearch, page]);

  const { data: response, isSuccess } = useGetAllPublicProductVariants(filterParams);

  useEffect(() => {
    if (isSuccess && response?.data?.data) {
      setVariants(response.data.data.data ?? []);
    }
  }, [isSuccess, response]);

  // A new search invalidates whatever page the shopper was on.
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  return (
    <div id="top" className="min-h-screen bg-background text-foreground antialiased">
      <UtilityBar />
      <Header searchText={searchText} onSearchChange={setSearchText} />
      {/* <Hero {...(heroVariant && imageFor(heroVariant) ? { imageUrl: imageFor(heroVariant) } : {})} imageAlt={heroVariant?.product?.name ?? ''} />
      <TrustStrip /> */}
      {/* <PromoTiles /> */}

      <section id="all-products" className="container mx-auto px-4 py-10">
        <PublicVariantList />
      </section>

      <FeaturedProducts />
      <Testimonials />
      <WidePromo />
      <Blog />
      <Brands />
      <Newsletter />
      <Footer />
    </div>
  );
}
