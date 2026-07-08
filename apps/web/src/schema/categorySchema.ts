import { CreateCategoryModel } from '@/models/category.model';
import * as Yup from 'yup';

const CategorySchema: Yup.ObjectSchema<CreateCategoryModel> = Yup.object().shape({
  name: Yup.string().required('Name is required'),
  description: Yup.string().optional(),
  parentId: Yup.number().integer().positive().optional(),
  status: Yup.string().oneOf(['Published', 'Draft'], 'Status must be Published or Draft').required('Status is required'),
});

export default CategorySchema;
