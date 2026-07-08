import { Request, Response } from "express";
import IUnitOfService from "../services/interfaces/iunitof.service";
import { TYPES } from "../config/ioc.types";
import { container } from "../config/ioc.config";

export class HealthController {
  constructor(
    private unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService)
  ) {
    this.unitOfService = unitOfService;
  }

  /**
   * Handles a health check request.
   *
   * Responds with a JSON object indicating the service status.
   *
   * @param req - The Express request object.
   * @param res - The Express response object.
   * @returns A response with HTTP status 200 and a JSON body `{ status: 'UP' }`.
   */
  async check(req: Request, res: Response) {
    return res.status(200).json({ status: "UP" });
  }
}
