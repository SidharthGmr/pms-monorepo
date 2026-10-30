'use client';

import ManageProduct from './add-edit';
import ProductView, { ProductViewBackLink } from './view-product';

interface ProductPageProps {
  id: number;
}

export default function ProductPage({ id }: ProductPageProps) {
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
