'use client';

import { useSearchParams } from 'next/navigation';
import EditableVariant, { EditableVariantBackLink } from './editable-variant';

interface VariantPageProps {
  id: number;
}

// A variant's own page. The details edit in place, so there is no separate form screen;
// `?edit=1` opens straight into editing, which is what the lists' pencil links to.
export default function VariantPage({ id }: VariantPageProps) {
  const searchParams = useSearchParams();

  return (
    <div className="mx-auto w-full max-w-6xl space-y-4">
      <EditableVariantBackLink />
      <EditableVariant id={id} defaultEditing={searchParams.get('edit') === '1'} />
    </div>
  );
}
