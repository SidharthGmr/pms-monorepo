import { Request, Response, NextFunction } from "express";
import { ZodError, ZodType } from "zod";
import { CustomResponse, PlainDto } from '@pms/types';
/**
 * Wraps a schema shaped as `{ body?, query?, params? }` and rejects a bad request
 * with the same `{ success, message, errors }` envelope every other endpoint uses,
 * so the web client can surface the message without special-casing validation.
 */
export const validate =
  (schema: ZodType<any>) =>
  (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    if (result.success) {
      // Replace the request parts with the PARSED values: zod strips keys the schema does not
      // declare, which is what stops a body from smuggling extra columns (role, storeCode,
      // isActive, ...) past validation and into a Prisma spread.
      const data = result.data as { body?: unknown; query?: unknown; params?: unknown };
      if (data.body !== undefined) req.body = data.body;
      if (data.query !== undefined) {
        // Express 5 exposes req.query through a getter, so it cannot be assigned directly.
        Object.defineProperty(req, 'query', { value: data.query, writable: true, configurable: true });
      }
      if (data.params !== undefined) req.params = data.params as typeof req.params;
      return next();
    }

    return res.status(400).json(toValidationResponse(result.error));
  };

function toValidationResponse(error: ZodError): CustomResponse<PlainDto> {
  const errors = error.issues.map((issue) => {
    // issue.path is ['body', 'sellingPrice']; drop the container segment so the
    // client sees the field name its own form uses.
    const field = issue.path.slice(1).join('.');
    return field ? `${field}: ${issue.message}` : issue.message;
  });

  // `errors` is a string[] by contract - the web client joins it for display
  // (ErrorHandlerService), so an object array would render as [object Object].
  return {
    success: false,
    message: error.issues[0]?.message || 'Validation failed',
    errors,
  };
}
