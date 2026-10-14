import CmsPageEditor from '@/components/features/cms-pages/editor';
import config from '@/config';
import { Metadata } from 'next';

interface AdminCmsPageEditorPageProps {
  params: {
    id: string;
  };
}

export function generateMetadata({ params }: AdminCmsPageEditorPageProps): Metadata {
  const id = Number(params.id);
  return {
    title: `${id > 0 ? 'Edit Page' : 'Add Page'} - ${config.appName}`,
  };
}

export default function AdminCmsPageEditorPage({ params }: AdminCmsPageEditorPageProps) {
  // The route is shared: /admin/pages/0 renders the create form, /admin/pages/12 edits page 12.
  const id = Number(params.id);

  return (
    <div className="mx-auto w-full max-w-5xl space-y-4">
      <CmsPageEditor id={Number.isFinite(id) ? id : 0} />
    </div>
  );
}
