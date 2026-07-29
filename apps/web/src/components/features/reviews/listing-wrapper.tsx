'use client';
import { PageHeader } from '@/components/common/page-header';
import { Card } from '@/components/ui/card';
import ReviewList from '.';

export default function ReviewListingWrapper() {
  return (
    <>
      {/* No action button: reviews are written by customers, never created here. */}
      <PageHeader title="Reviews" description="Moderate customer ratings and reply to them" />
      <Card>
        <ReviewList />
      </Card>
    </>
  );
}
