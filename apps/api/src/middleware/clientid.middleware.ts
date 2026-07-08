import { Request, Response, NextFunction } from "express";
import CustomResponse from "../dtos/custom-response";
import PlainDto from "../dtos/plain.dto";

class ClientIdMiddleware {
  verify(req: Request, res: Response, next: NextFunction) {
    const clientId: string | undefined = Array.isArray(req.headers["clientid"]) ? req.headers["clientid"][0] : req.headers["clientid"] || "";
    const _clientId = process.env.CLIENT_ID;

    if (!clientId && process.env.SITE_MODE !== "local") {
      const response: CustomResponse<PlainDto> = {
        success: false,
        message: "ClientId header is missing",
      };
      res.status(401).json(response);
      return;
    }

    if (clientId !== _clientId && process.env.SITE_MODE !== "local") {
      const response: CustomResponse<PlainDto> = {
        success: false,
        message: "Invalid Client Id",
      };
      console.log("Client ID matched:", clientId);
      return res.status(401).json(response);
    }

    req.headers["clientid"] = clientId;

    // Call next to pass control to the next middleware or route handler
    next();
  }
}

export default new ClientIdMiddleware();