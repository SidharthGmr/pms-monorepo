import CustomError from './custom-error';

export default class ConflictError extends CustomError {
  constructor(message: string) {
    super(message, 409);
  }
}
