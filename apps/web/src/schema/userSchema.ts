import { CreateUserModel } from '@/models/user.model';
import * as Yup from 'yup';
import { emailField, nameField, passwordField, phoneField } from './customeSchema';

export const SignupSchema: Yup.ObjectSchema<CreateUserModel> = Yup.object().shape({
  firstName: nameField(),
  lastName: nameField(),
  email: emailField(),
  password: passwordField(),
  phone: phoneField(),
  isRegisterbyShop: Yup.boolean().optional(),
  role: Yup.string().optional(),
});

export default SignupSchema;
