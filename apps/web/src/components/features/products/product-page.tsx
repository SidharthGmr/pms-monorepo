'use client';

import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import ManageProduct from './add-edit';
import ProductView, { ProductViewBackLink } from './view-product';

interface ProductPageProps {
  id: number;
}

export default function ProductPage({ id }: ProductPageProps) {
  const searchParams = useSearchParams();
  const isNew = !(id > 0);

  if (isNew) {
    return <ManageProduct id={0} />;
  }

  return (
    <>
      <ProductViewBackLink />
      <ProductView id={id} />
    </>
  );
}
