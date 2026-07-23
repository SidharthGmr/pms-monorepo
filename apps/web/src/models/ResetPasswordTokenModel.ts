export default interface ResetPasswordTokenModel {
  token: string;
  newPassword: string;
  confirmPassword: string;
}
