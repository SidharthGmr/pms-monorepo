
import * as Yup from 'yup';
import { CreateSupplierModel, Status } from '@pms/types';

const SupplierSchema: Yup.ObjectSchema<CreateSupplierModel> = Yup.object().shape({
  name: Yup.string().required('Supplier name is required'),
  contactPerson: Yup.string().nullable().optional(),
  email: Yup.string().email('Invalid email').required('Email is required'),
  phone: Yup.string().required('Phone is required'),
  address: Yup.string().nullable().optional(),
  notes: Yup.string().nullable().optional(),
  status: Yup.mixed<Status>().oneOf(['Published', 'Draft', 'Trash']).required('Status is required'),
  displayOrder: Yup.number().nullable().optional().default(0),
});

export default SupplierSchema;
