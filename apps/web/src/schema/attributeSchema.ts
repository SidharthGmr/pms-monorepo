import { CreateAttributeModel } from '@/models/attribute.model';
import * as Yup from 'yup';

const AttributeSchema: Yup.ObjectSchema<CreateAttributeModel> = Yup.object().shape({
  name: Yup.string().min(1, 'Name is required').required('Name is required'),
  unit: Yup.string().nullable().optional(),
  status: Yup.string().oneOf(['Published', 'Draft'], 'Status must be Published or Draft').required('Status is required'),
  displayOrder: Yup.number().min(1, 'Display order must be 1 or greater').optional(),
});

export default AttributeSchema;
