
import * as Yup from 'yup';
import { RecoverPasswordModel } from '@pms/types';

const RecoverPasswordSchema: Yup.ObjectSchema<RecoverPasswordModel> = Yup.object().shape({
  Email: Yup.string().required('Business Email is required'),
  password: Yup.string().required('Password is required'),
  //confirmPassword: Yup.string().required('Password is required'),
});

export default RecoverPasswordSchema;
