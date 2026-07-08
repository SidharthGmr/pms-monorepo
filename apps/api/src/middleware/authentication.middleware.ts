import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import config from "../config";
import CustomResponse from "../dtos/custom-response";
import PlainDto from "../dtos/plain.dto";

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    const response: CustomResponse<PlainDto> = {
      success: false,
      message: "Token missing",
    };
    res.status(401).json(response);
    return;
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    const response: CustomResponse<PlainDto> = {
      success: false,
      message: "Token missing",
    };
    res.status(401).json(response);
    return;
  }

  try {
    if (!config.jwt.secret) {
      const response: CustomResponse<PlainDto> = {
        success: false,
        message: "JWT secret not configured",
      };
      res.status(500).json(response);
      return;
    }

    const decoded = jwt.verify(token, config.jwt.secret, {
      algorithms: ["HS256"],
      audience: config.jwt.audience || undefined,
      issuer: config.jwt.issuer || undefined,
    }) as JwtPayload;

    req.user = {
      userId: decoded.userId,
      name: decoded.name,
      email: decoded.email,
      role: decoded.role,
      storeCode: decoded.storeCode,
    };
    return next();
  } catch (err: any) {
    const response: CustomResponse<PlainDto> = {
      success: false,
      message: "Invalid or expired token",
    };
    res.status(401).json(response);
    return;
  }
};
