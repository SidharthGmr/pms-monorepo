import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import ProductView from '@/components/features/products/view-product';
import config from '@/config';
import { CustomResponse, ProductResponseDto } from '@pms/types';
import { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { notFound } from 'next/navigation';

interface ProductsPageProps {
  params: {
    id: string;
  };
}

const fetchProduct = async (id: number): Promise<ProductResponseDto | null> => {
  if (!Number.isFinite(id) || id <= 0) return null;

  const session = await getServerSession(authOptions);
  const accessToken = (session?.user as { token?: string } | undefined)?.token;
  if (!accessToken) return null;

  try {
    const res = await fetch(`${config.apiBaseUrl}/products/${id}`, {
      headers: {
        clientId: config.clientId,
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      console.error('Product fetch failed:', { id, status: res.status });
      return null;
    }

    const json: CustomResponse<ProductResponseDto> = await res.json();
    return json.data ?? null;
  } catch (error) {
    console.error('Product fetch error:', error);
    return null;
  }
};

export async function generateMetadata({ params }: ProductsPageProps): Promise<Metadata> {
  const product = await fetchProduct(Number(params.id));
  return {
    title: `${product?.name ?? 'Product'} - ${config.appName}`,
    ...(product?.description ? { description: product.description } : {}),
  };
}

export default async function ProductsPage({ params }: ProductsPageProps) {
  const product = await fetchProduct(Number(params.id));
  if (!product) return notFound();

  return (
    <div className="mx-auto w-full max-w-7xl space-y-4">
      <ProductView id={product.id} />
    </div>
  );
}
