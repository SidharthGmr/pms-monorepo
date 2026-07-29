import WishlistListingWrapper from '@/components/features/wishlists/listing-wrapper';
import config from '@/config';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: `Customer Wishlists - ${config.appName}`,
};

export default function AdminWishlistPage() {
  return (
    <div className="grid gap-5">
      <WishlistListingWrapper />
    </div>
  );
}
