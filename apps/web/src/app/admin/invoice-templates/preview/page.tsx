import InvoiceTemplatePreview from '@/components/features/settings/invoice-templates/preview';
import config from '@/config';
import { Metadata } from 'next';
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: `Invoice Preview - ${config.appName}`,
};

export default function InvoiceTemplatePreviewPage() {
  return (
    <Suspense>
      <InvoiceTemplatePreview />
    </Suspense>
  );
}
