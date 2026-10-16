import ManageVariant from '@/components/features/product-variants/add-edit';
import config from '@/config';
import { ArrowLeft, Layers } from 'lucide-react';
import { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: `Add variant - ${config.appName}`,
};

interface AddVariantPageProps {
  searchParams: { productId?: string };
}

// Arriving from a product screen pre-selects that product, so the only thing left to pick is
// the variant's own options, price and images. The form reads nothing else from the URL.
export default function AddVariantPage({ searchParams }: AddVariantPageProps) {
  const parsed = Number(searchParams.productId);
  const productId = Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
  const backHref = productId ? `/admin/products/${productId}` : '/admin/products/variants';

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4">
      <Link
        href={backHref}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        {productId ? 'Back to product' : 'Back to variants'}
      </Link>

      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <Layers className="h-5 w-5 text-primary" />
        </div>
        <div className="min-w-0">
          <h1 className="text-lg font-semibold leading-tight">Add variant</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">Pick the options, price and images — the name and SKU are generated for you.</p>
        </div>
      </div>

      <Suspense>
        <ManageVariant productId={productId} />
      </Suspense>
    </div>
  );
}
