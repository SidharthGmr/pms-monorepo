import MyReviewsList from '@/components/features/reviews/my-reviews';
import config from '@/config';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: `My Reviews - ${config.appName}`,
};

export default function MyReviewsPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <MyReviewsList />
    </div>
  );
}
