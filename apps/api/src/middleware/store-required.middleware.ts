import { Request, Response, NextFunction } from "express";
import CustomResponse from "../dtos/custom-response";
import PlainDto from "../dtos/plain.dto";

/**
 * Middleware to ensure the authenticated user has a store assigned.
 * Must be placed AFTER authenticateToken middleware.
 * 
 * Usage:
 * router.post('/products', authenticateToken, storeRequiredMiddleware, productController.create);
 */
export const storeRequiredMiddleware = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const storeCode = req.user?.storeCode;

    if (!storeCode) {
        const response: CustomResponse<PlainDto> = {
            success: false,
            message: "You must be assigned to a store to perform this action. Please contact your administrator.",
        };
        return res.status(403).json(response);
    }

    next();
};
