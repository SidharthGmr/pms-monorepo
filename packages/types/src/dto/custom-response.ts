export default interface CustomResponse<T> {
  success: boolean;
  errors?: string[];
  message?: string;
  errorCode?: string;
  data?: T;
}
