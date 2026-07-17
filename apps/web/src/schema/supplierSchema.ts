import { CreateSupplierModel } from '@/models/supplier.model';
import * as Yup from 'yup';

const SupplierSchema: Yup.ObjectSchema<CreateSupplierModel> = Yup.object().shape({
  name: Yup.string().required('Supplier name is required'),
  contactPerson: Yup.string().nullable().optional(),
  email: Yup.string().email('Invalid email').nullable().optional(),
  phone: Yup.string().nullable().optional(),
  address: Yup.string().nullable().optional(),
  notes: Yup.string().nullable().optional(),
  status: Yup.string().required('Status is required'),
  displayOrder: Yup.number().nullable().optional().default(0),
});

export default SupplierSchema;
