import { OTPModel } from '@/models/otp.model';
import * as Yup from 'yup';

const OtpSchema: Yup.ObjectSchema<OTPModel> = Yup.object().shape({
  otp: Yup.number().required('OTP is required'),
});

export default OtpSchema;
