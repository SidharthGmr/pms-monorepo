
import * as Yup from 'yup';
import { SignupModel } from '@pms/types';

const SignupSchema: Yup.ObjectSchema<SignupModel> = Yup.object().shape({
  name: Yup.string().required('Username is required'),
  email: Yup.string().email('Invalid email format').required('Email is required'),
  phone: Yup.string()
    .matches(/^[0-9]+$/, 'Phone must contain only numbers')
    .required('Phone is required'),
  password: Yup.string().min(8, 'Password must be at least 8 characters').required('Password is required'),
});

export default SignupSchema;
