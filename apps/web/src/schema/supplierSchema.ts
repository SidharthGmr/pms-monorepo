import { CreateSupplierModel } from '@/models/supplier.model';
import * as Yup from 'yup';

const SupplierSchema: Yup.ObjectSchema<CreateSupplierModel> = Yup.object().shape({
  name: Yup.string().required('Supplier name is required'),
  contactPerson: Yup.string().nullable().optional(),
  email: Yup.string().email('Invalid email').required('Email is required'),
  phone: Yup.string().required('Phone is required'),
  address: Yup.string().nullable().optional(),
  notes: Yup.string().nullable().optional(),
  status: Yup.string().required('Status is required'),
  displayOrder: Yup.number().nullable().optional().default(0),
});

export default SupplierSchema;
