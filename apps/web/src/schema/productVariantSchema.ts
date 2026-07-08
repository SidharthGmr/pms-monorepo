import * as Yup from 'yup';
import { CreateProductVariantModel } from '@/models/product-variant.model';

const ProductVariantSchema: Yup.ObjectSchema<CreateProductVariantModel> = Yup.object().shape({
    name: Yup.string().required('Name is required'),
    slug: Yup.string().optional(),
    productId: Yup.number().required('Product is required'), 
    productAttributeId:Yup.number().optional().default(0),
    attributeId:Yup.number().optional().default(0),
    cost:Yup.number().required('Cost is required'),
    Price:Yup.number().required('Price is required'),
    stock:Yup.number().required('Stock is required'),
    lowStockThreshold:Yup.number().optional(),
    status: Yup.string().required('Status is required'), 
});

export default ProductVariantSchema;
 
 
 
 