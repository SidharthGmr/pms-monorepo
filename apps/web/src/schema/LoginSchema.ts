import { LoginModel } from '@/models/login.model';
import * as Yup from 'yup';
import { emailField } from './customeSchema';

const LoginSchema: Yup.ObjectSchema<LoginModel> = Yup.object().shape({
  email: emailField(),
  password: Yup.string().required('Password is required'),
});

export default LoginSchema;
