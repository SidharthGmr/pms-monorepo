export default interface RegistrationModel {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword?: string;
}
