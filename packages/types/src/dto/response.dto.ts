export default interface Response<T> {
  success: boolean;
  errors: string[];
  message: string;
  errorCode: string;
  data: T;
}
