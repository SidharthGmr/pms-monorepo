import { Prisma } from '@prisma/client';
import { Request, Response, NextFunction } from 'express';
import CustomResponse from '../dtos/custom-response';
import PlainDto from '../dtos/plain.dto';
import ResponseErrorDto from '../dtos/response-error.dto';
import ClientError from '../exceptions/client-error';
import CustomError from '../exceptions/custom-error';
import NotFoundError from '../exceptions/not-found-error';
import logger from '../utils/logger';
import { isProduction } from '../config/env';

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

export default function errorHandler(err: any, req: Request, res: Response, _next: NextFunction) {
  // A duplicate value is bad user input, not a server fault. Prisma's P2002 is
  // not a CustomError, so without this it would fall through as a 500 - and the
  // web client rejects any 500 outright, so the UI could never show the message.
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
    err = new ClientError(duplicateRecordMessage(err));
  }

  // A record the caller asked for by id that Prisma could not find is a 404,
  // not a crash. P2025 otherwise reaches the client as an opaque 500.
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
    err = new NotFoundError('The requested record no longer exists.');
  }

  // Malformed JSON in the request body: body-parser throws a SyntaxError with
  // a `body` property, which is a client mistake rather than a server fault.
  if (err instanceof SyntaxError && 'body' in err) {
    err = new ClientError('Request body is not valid JSON.');
  }

  const requestId = req.requestId;

  if (!(err instanceof CustomError)) {
    // The only place an unexpected failure is recorded. Without this the cause
    // of a production 500 is unrecoverable, since the response deliberately
    // withholds the message.
    logger.error('unhandled error', {
      requestId,
      method: req.method,
      path: req.originalUrl,
      userId: req.user?.userId,
      name: err?.name,
      error: err?.message,
      stack: err?.stack,
    });

    const response: CustomResponse<PlainDto> = {
      success: false,
      // The real message can name a table, a column or a connection string, so
      // it is only echoed outside production.
      message: isProduction ? 'Server error, please try again later' : err?.message || 'Server error',
      ...(requestId ? { errorCode: requestId } : {}),
    };

    res.status(500).json(response);
    return;
  }

  const customError = err as CustomError;

  // 4xx is the client's problem and is already visible in the access log; a
  // 5xx raised deliberately still needs the detail captured.
  if (customError.status >= 500) {
    logger.error('handled server error', {
      requestId,
      method: req.method,
      path: req.originalUrl,
      status: customError.status,
      error: customError.message,
      stack: customError.stack,
    });
  }

  const response = { message: customError.message } as ResponseErrorDto;

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
}
