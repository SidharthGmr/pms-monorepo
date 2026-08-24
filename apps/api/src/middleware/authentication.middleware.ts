import { NextFunction, Request, Response } from "express";
import { container } from "../config/ioc.config";
import { TYPES } from "../config/ioc.types";
import CustomResponse from "../dtos/custom-response";
import PlainDto from "../dtos/plain.dto";
import IUnitOfService from "../services/interfaces/iunitof.service";
import { ACCESS_TOKEN_TYPE, verifySessionToken } from "../utils/token.util";
import config from "../config";

const unauthorized = (res: Response, message: string) => {
  const response: CustomResponse<PlainDto> = {
    success: false,
    message,
  };
  res.status(401).json(response);
};

export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return unauthorized(res, "Token missing");
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    return unauthorized(res, "Token missing");
  }

  if (!config.jwt.secret) {
    const response: CustomResponse<PlainDto> = {
      success: false,
      message: "JWT secret not configured",
    };
    res.status(500).json(response);
    return;
  }

  try {
    const decoded = verifySessionToken(token);

    if (decoded.type !== ACCESS_TOKEN_TYPE) {
      return unauthorized(res, "Invalid or expired token");
    }

    const sessionId = decoded.sid;
    if (!sessionId) {
      return unauthorized(res, "Session is no longer valid. Please login again.");
    }

    const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
    const session = await unitOfService.UserSession.validateAccessToken(sessionId, token);

    if (!session) {
      return unauthorized(res, "Session has expired or been revoked. Please login again.");
    }

    req.user = {
      userId: decoded.userId as string,
      name: decoded.name,
      email: decoded.email,
      role: decoded.role,
      storeCode: decoded.storeCode,
      sessionId,
    };
    return next();
  } catch {
    return unauthorized(res, "Invalid or expired token");
  }
};
