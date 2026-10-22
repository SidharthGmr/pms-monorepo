
import * as Yup from 'yup';
import { emailField } from './customeSchema';
import { LoginModel } from '@pms/types';

const LoginSchema: Yup.ObjectSchema<LoginModel> = Yup.object().shape({
  email: emailField(),
  password: Yup.string().required('Password is required'),
});

export default LoginSchema;
