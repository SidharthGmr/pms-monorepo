import * as Yup from 'yup';
import { CreateStoreModel, Status } from '@pms/types';

const StoreSchema: Yup.ObjectSchema<CreateStoreModel> = Yup.object().shape({
    name: Yup.string().required('Store name is required'),
    code: Yup.string().required('Store code is required'),
    address: Yup.string().optional(),
    phone: Yup.string().optional(),
    email: Yup.string().email('Invalid email format').optional(),
    isActive: Yup.boolean().optional().default(true),
    status: Yup.mixed<Status>().oneOf(['Published', 'Draft', 'Trash']).optional(),
});

export default StoreSchema;
