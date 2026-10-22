
import * as Yup from 'yup';
import { OTPModel } from '@pms/types';

const OtpSchema: Yup.ObjectSchema<OTPModel> = Yup.object().shape({
  otp: Yup.number().required('OTP is required'),
});

export default OtpSchema;
