import RegistrationModel from '@/models/registration-model';
import * as Yup from 'yup';
import { confirmPasswordField, emailField, nameField, passwordField } from './customeSchema';

const RegistrationSchema: Yup.ObjectSchema<RegistrationModel> = Yup.object().shape({
  name: nameField(),
  email: emailField(),
  phone: Yup.string().required('Phone is required').min(10, 'Phone number must be at least 10 digits'),
  password: passwordField(),
  confirmPassword: confirmPasswordField(),
});

export default RegistrationSchema;
