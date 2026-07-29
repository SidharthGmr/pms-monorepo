import WishlistGrid from '@/components/features/wishlists/my-wishlist';
import config from '@/config';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: `My Wishlist - ${config.appName}`,
};

export default function WishlistPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <WishlistGrid />
    </div>
  );
}
