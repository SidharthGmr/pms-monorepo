import { Prisma } from '@prisma/client';
import { Request, Response, NextFunction } from 'express';
import CustomResponse from '../dtos/custom-response';
import PlainDto from '../dtos/plain.dto';
import ResponseErrorDto from '../dtos/response-error.dto';
import ClientError from '../exceptions/client-error';
import CustomError from '../exceptions/custom-error';

// Columns that take part in composite unique keys but are never typed by the
// user, so they only add noise to a duplicate-record message.
const TENANT_COLUMNS = new Set(['storeCode']);

// 'brandName' -> 'brand name'
function humanizeModelName(modelName?: string): string {
  if (!modelName) return 'record';
  return modelName.replace(/([a-z0-9])([A-Z])/g, '$1 $2').toLowerCase();
}

// P2002 = unique constraint violation. meta looks like
// { modelName: 'brandName', target: ['name', 'storeCode'] }
function duplicateRecordMessage(err: Prisma.PrismaClientKnownRequestError): string {
  const target = err.meta?.['target'];
  const columns = Array.isArray(target) ? target.filter((c): c is string => typeof c === 'string') : typeof target === 'string' ? [target] : [];
  const fields = columns.filter((c) => !TENANT_COLUMNS.has(c));
  const model = humanizeModelName(err.meta?.['modelName'] as string | undefined);

  if (fields.length === 0) return `This ${model} already exists.`;
  return `A ${model} with this ${fields.join(' and ')} already exists.`;
}

export default function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  // A duplicate value is bad user input, not a server fault. Prisma's P2002 is
  // not a CustomError, so without this it would fall through as a 500 - and the
  // web client rejects any 500 outright, so the UI could never show the message.
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
    err = new ClientError(duplicateRecordMessage(err));
  }

  if (!(err instanceof CustomError)) {
    const response: CustomResponse<PlainDto> = {
      success: false,
      message: process.env.NODE_ENV === 'development' ? err.message : 'Server error, please try again later',
    };

    res.status(500).json(response);
    return;
  } else {
    const customError = err as CustomError;

    let response = { message: customError.message, } as ResponseErrorDto;

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
