import CustomError from './custom-error';

export default class ClientError extends CustomError {
  constructor(message: string) {
    super(message, 400);
  }
}
