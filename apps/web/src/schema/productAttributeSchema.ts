import * as Yup from 'yup';
import { CreateProductAttributeModel } from '@/models/product-attribute.model';

const ProductAttributeSchema: Yup.ObjectSchema<CreateProductAttributeModel> = Yup.object().shape({
    productId: Yup.number()
        .typeError('Product is required')
        .integer()
        .positive('Product is required')
        .required('Product is required'),
    attributeId: Yup.number()
        .typeError('Attribute ID is required')
        .integer()
        .positive('Attribute ID is required')
        .required('Attribute ID is required'),
    value: Yup.string().min(1, 'Value is required').required('Value is required'),
});

export default ProductAttributeSchema;
