import { Request, Response, NextFunction } from 'express';
import CustomError from '../exceptions/custom-error';
import CustomResponse from '../dtos/custom-response';
import PlainDto from '../dtos/plain.dto';
import ResponseErrorDto from '../dtos/response-error.dto';

export default function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  if (!(err instanceof CustomError)) {
    const response: CustomResponse<PlainDto> = {
      success: false,
      message: process.env.NODE_ENV === 'development' ? err.message : 'Server error, please try again later',
    };

    res.status(500).json(response);
    return;
  } else {
    const customError = err as CustomError;

    let response = {message: customError.message,} as ResponseErrorDto;

    // Check if there is more info to return.
    if (customError.additionalInfo) {
      response.additionalInfo = customError.additionalInfo;
    }

    const jsonResponse: CustomResponse<PlainDto> = {
      success: false,
      message: response.message,
      ...(response.additionalInfo ? { errors: [response.additionalInfo] } : {}),
    };

    res.status(customError.status).json(jsonResponse);
    return;
  }
}
