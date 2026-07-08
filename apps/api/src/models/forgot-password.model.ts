export interface verifyEmailModel {
  email: string;
  otp: string;
}

export interface ResetPasswordModel {
  email: string;
  otp: string;
  newPassword: string;
  confirmPassword: string;
}
