import CategoryListingWrapper from '@/components/features/categories/listing-wrapper';
import config from '@/config';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: `Category List- ${config.appName}`,
};

export default function CategoriesPage() {
  return (
    <div className="grid gap-5">
      <CategoryListingWrapper />
    </div>
  );
}
