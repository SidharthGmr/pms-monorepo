export interface verifyEmailModel {
  email: string;
  otp: string;
}

export interface ResetPasswordModel {
  token: string;
  newPassword: string;
  confirmPassword: string;
}
