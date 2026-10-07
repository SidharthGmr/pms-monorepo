import { redirect } from 'next/navigation';

interface VariantPriceHistoryPageProps {
  params: {
    id: string;
  };
}

// Legacy path-param form; the page itself reads the variant from the query string.
export default function VariantPriceHistoryPage({ params }: VariantPriceHistoryPageProps) {
  const id = Number(params.id);
  redirect(Number.isFinite(id) && id > 0 ? `/admin/product-variants/price-histories?variantId=${id}` : '/admin/product-variants/price-histories');
}
