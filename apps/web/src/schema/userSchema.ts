
import * as Yup from 'yup';
import { emailField, nameField, passwordField, phoneField } from './customeSchema';
import { CreateUserModel, Role } from '@pms/types';

export const SignupSchema: Yup.ObjectSchema<CreateUserModel> = Yup.object().shape({
  firstName: nameField(),
  lastName: nameField(),
  email: emailField(),
  password: passwordField(),
  phone: phoneField(),
  isRegisteredByShop: Yup.boolean().optional(),
  role: Yup.mixed<Role>().oneOf(['SUPER_ADMIN', 'ADMIN', 'USER', 'STAFF']).optional(),
});

export default SignupSchema;
