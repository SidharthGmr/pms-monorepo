import PublicDocumentView from '@/components/features/share/public-document-view';
import config from '@/config';
import { Metadata } from 'next';
import { fetchPublicDocument } from '../../fetch-public-document';
import PublicDocumentMissing from '@/components/features/share/public-document-missing';

// A share link must never be indexed, and must always reflect the document as it stands now.
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: `Estimate - ${config.appName}`,
  robots: { index: false, follow: false },
};

interface SharedEstimatePageProps {
  params: {
    token: string;
  };
}

export default async function SharedEstimatePage({ params }: SharedEstimatePageProps) {
  const document = await fetchPublicDocument('estimates', decodeURIComponent(params.token));
  if (!document) return <PublicDocumentMissing kind="estimate" />;

  return <PublicDocumentView document={document} />;
}
