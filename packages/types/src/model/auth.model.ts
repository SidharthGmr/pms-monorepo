export interface LoginModel {
  email: string;
  password: string;
}

export interface SignupModel {
  name: string;
  email: string;
  phone: string;
  password: string;
}

export interface RegistrationModel extends SignupModel {
  confirmPassword?: string;
}

export interface ForgotPasswordModel {
  email: string;
}

/** Reset with the OTP the user received by email. */
export interface ResetPasswordModel {
  otp: string;
  password: string;
  confirmPassword: string;
}

/** Reset with the single-use token from the reset link. */
export interface ResetPasswordTokenModel {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ChangePasswordModel {
  OldPassword: string;
  NewPassword: string;
  ConfirmPassword: string;
}

export interface RecoverPasswordModel {
  Email: string;
  password: string;
}

export interface VerifyTokenModel {
  token: string;
}

export interface VerifyEmailModel {
  email: string;
  otp: string;
}

export interface OTPModel {
  otp: number;
}
