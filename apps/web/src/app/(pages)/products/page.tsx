import PublicVariantList from '@/components/features/public-variants';
import PageBanner from '@/components/storefront/page-banner';
import config from '@/config';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: `Products - ${config.appName}`,
  description: 'Browse every product variant currently available to buy.',
};

const BADGES = ['Live stock counts', 'Dated price history'];

export default function PublicProductsPage() {
  return (
    <main>
      <PageBanner
        eyebrow="Catalogue"
        title="All products"
        description="Every variant in stock or coming soon, shown with the price being charged right now."
        crumbs={[{ label: 'Home', href: '/' }, { label: 'Products' }]}
        aside={BADGES.map((badge) => (
          <span
            key={badge}
            className="rounded-full border border-storefront-surface-border bg-white/5 px-3 py-1 text-xs font-medium text-storefront-surface-foreground"
          >
            {badge}
          </span>
        ))}
      />

      <div className="container mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6">
        <PublicVariantList />
      </div>
    </main>
  );
}
