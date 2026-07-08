import ChangePasswordModel from '@/models/ChangePasswordModel';
import * as Yup from 'yup';

const ChangePasswordSchema: Yup.ObjectSchema<ChangePasswordModel> = Yup.object().shape({
  OldPassword: Yup.string()
    .required('Username is required')
    .min(5, 'Minimum 5 characters allowed')
    .max(50, { message: 'Maximum 100 characters allowed' })
    .test('nameValidation', 'Invalid Name', (value) => {
      if (value) {
        const pattern = /^[a-zA-Z0-9'.\\s]+$/;
        return pattern.test(value);
      }
      return true;
    }),
  NewPassword: Yup.string().required('Password is required'),
  ConfirmPassword: Yup.string().required('Password is required'),
});

export default ChangePasswordSchema;
