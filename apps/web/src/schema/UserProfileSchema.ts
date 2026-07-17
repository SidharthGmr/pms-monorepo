
import { UpdateProfileModel } from '@pms/types';
import * as Yup from 'yup';

const UserProfileSchema: Yup.ObjectSchema<UpdateProfileModel> = Yup.object().shape({
  firstName: Yup.string()
    .required('First name is required')
    .min(5, 'Minimum 5 chars required')
    .max(50, 'Minimum 50 chars allowed')
    .test('nameValidation', 'Invalid name', (value) => {
      if (value) {
        const pattern = /^[a-zA-Z0-9'.\s]+$/;
        return pattern.test(value);
      }
      return true;
    }),
  lastName: Yup.string()
    .required('Last name is required')
    .min(5, 'Minimum 5 chars required')
    .max(50, 'Minimum 50 chars allowed')
    .test('nameValidation', 'Invalid name', (value) => {
      if (value) {
        const pattern = /^[a-zA-Z0-9'.\s]+$/;
        return pattern.test(value);
      }
      return true;
    }),
  phone: Yup.string()
    .required('Phone is required')
    .test('phoneValidation', 'Invalid phone', (value) => {
      if (value) {
        const pattern = /^[0-9'.\s]+$/;
        return pattern.test(value);
      }
      return true;
    }),
  emailId: Yup.string()
    .required('Email is required')
    .test('emailValidation', 'Invalid email', (value) => {
      if (value) {
        const pattern =
          /^([\w.-]+)@((\[(\d{1,3}\.){3})|(?!hotmail|gmail|googlemail|aol|yahoo|gmx|ymail|outlook|bluewin|protonmail|t-online|web\.|online\.|aol\.|live\.)(([a-zA-Z\d-]+\.)+))([a-zA-Z]{2,63}|\d{1,3})(\]?)$/;
        return pattern.test(value);
      }
      return true;
    }),
});

export default UserProfileSchema;
