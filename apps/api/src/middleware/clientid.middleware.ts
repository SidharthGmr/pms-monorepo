import { Request, Response, NextFunction } from "express";
import { timingSafeEqual } from "crypto";
import CustomResponse from "../dtos/custom-response";
import PlainDto from "../dtos/plain.dto";
import env, { isLocalMode } from "../config/env";

/** Constant-time compare so a wrong clientId cannot be recovered byte-by-byte from response timing. */
function matches(candidate: string, expected: string): boolean {
  const a = Buffer.from(candidate);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

class ClientIdMiddleware {
  verify(req: Request, res: Response, next: NextFunction) {
    // Local runs bypass the gate entirely so scripts and Swagger need no header.
    // env.ts refuses to boot with SITE_MODE=local under NODE_ENV=production.
    if (isLocalMode) return next();

    const header = req.headers["clientid"];
    const clientId = (Array.isArray(header) ? header[0] : header) || "";

    if (!clientId || !matches(clientId, env.CLIENT_ID)) {
      // Deliberately the same message and status for a missing and a wrong header:
      // telling a caller which one it was only helps someone probing the gate.
      const response: CustomResponse<PlainDto> = {
        success: false,
        message: "Invalid or missing ClientId header",
      };
      res.status(401).json(response);
      return;
    }

    next();
  }
}

export default new ClientIdMiddleware();
