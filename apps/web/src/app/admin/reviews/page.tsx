import ReviewListingWrapper from '@/components/features/reviews/listing-wrapper';
import config from '@/config';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: `Reviews - ${config.appName}`,
};

export default function ReviewsPage() {
  return (
    <div className="grid gap-5">
      <ReviewListingWrapper />
    </div>
  );
}
