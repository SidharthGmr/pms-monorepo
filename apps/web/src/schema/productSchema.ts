import { CreateProductModel } from '@/models/product.model';
import * as Yup from 'yup';

const ProductSchema: Yup.ObjectSchema<CreateProductModel> = Yup.object().shape({
  name: Yup.string().required('Product name is required'),
  slug: Yup.string().required('Slug is required'),
  price: Yup.number().typeError('Price must be a number').min(0, 'Price must be >= 0').required('Price is required'),
  categoryId: Yup.number().typeError('Category is required').required('Category is required'),
  parentId: Yup.number().typeError('Parent product must be a number').nullable().optional(),
  attributeId: Yup.number().typeError('Attribute must be a number').nullable().optional(),
  brandNameId: Yup.number().typeError('Brand must be a number').nullable().optional(),
  description: Yup.string().nullable().optional(),
  cost: Yup.number().typeError('Cost must be a number').min(0, 'Cost must be >= 0').nullable().optional(),
  stock: Yup.number().typeError('Stock must be a number').min(0, 'Stock must be >= 0').nullable().optional(),
  lowStockThreshold: Yup.number().typeError('Low stock threshold must be a number').min(0).nullable().optional(),
  displayOrder: Yup.number().typeError('Display order must be a number').nullable().optional(),
  images: Yup.array().of(Yup.string().required()).optional(),
  status: Yup.string().optional(),
});

export default ProductSchema;
