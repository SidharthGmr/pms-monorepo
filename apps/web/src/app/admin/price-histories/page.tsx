import { redirect } from 'next/navigation';

interface PriceHistoriesPageProps {
  searchParams: Record<string, string | string[] | undefined>;
}

// The ledger moved under /admin/product-variants so the sidebar keeps the Variants section
// active; this route only forwards old links there with their filters intact.
export default function PriceHistoriesPage({ searchParams }: PriceHistoriesPageProps) {
  const query = new URLSearchParams();
  Object.entries(searchParams).forEach(([key, value]) => {
    if (typeof value === 'string' && value !== '') query.set(key, value);
  });
  const suffix = query.toString();
  redirect(`/admin/product-variants/price-histories${suffix ? `?${suffix}` : ''}`);
}
