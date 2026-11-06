import { DETAIL_SURFACE as SURFACE } from '@/components/common/detail-document';
import { cn } from '@/lib/utils';
import { LinkIcon } from 'lucide-react';

/** A revoked, mistyped or expired-at-source link. Says nothing about whether it ever existed. */
export default function PublicDocumentMissing({ kind }: { kind: 'estimate' | 'invoice' }) {
  return (
    <main className="mx-auto w-full max-w-md px-4 py-16 sm:py-24">
      <div className={cn(SURFACE, 'px-6 py-12 text-center')}>
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <LinkIcon className="h-6 w-6" />
        </div>
        <h1 className="text-lg font-bold tracking-tight">This link is no longer available</h1>
        <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
          The {kind} may have been withdrawn, or the link may be incomplete. Please ask the store for a fresh link.
        </p>
      </div>
    </main>
  );
}
