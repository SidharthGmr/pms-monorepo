import PublicDocumentView from '@/components/features/share/public-document-view';
import config from '@/config';
import { Metadata } from 'next';
import { fetchPublicDocument } from '../../fetch-public-document';
import PublicDocumentMissing from '@/components/features/share/public-document-missing';

// A share link must never be indexed, and must always reflect the document as it stands now.
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: `Invoice - ${config.appName}`,
  robots: { index: false, follow: false },
};

interface SharedOrderPageProps {
  params: {
    token: string;
  };
}

export default async function SharedOrderPage({ params }: SharedOrderPageProps) {
  const document = await fetchPublicDocument('orders', decodeURIComponent(params.token));
  if (!document) return <PublicDocumentMissing kind="invoice" />;

  return <PublicDocumentView document={document} />;
}
