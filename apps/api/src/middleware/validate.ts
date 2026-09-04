import { Request, Response, NextFunction } from "express";
import { ZodError, ZodType } from "zod";
import CustomResponse from "../dtos/custom-response";
import PlainDto from "../dtos/plain.dto";

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

    if (result.success) return next();

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
