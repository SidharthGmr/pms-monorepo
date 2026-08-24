import { CreateBrandNameModel } from '@/models/brand-name.model';
import * as Yup from 'yup';

const BrandNameSchema: Yup.ObjectSchema<CreateBrandNameModel> = Yup.object().shape({
  name: Yup.string().required('Brand name is required'),
  images: Yup.array().of(Yup.string().required()).optional(),
  status: Yup.string().required('Status is required'),
  displayOrder: Yup.number().optional().default(0),
});

export default BrandNameSchema;
