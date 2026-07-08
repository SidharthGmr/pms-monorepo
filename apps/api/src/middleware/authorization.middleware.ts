import { Request, Response, NextFunction } from 'express';
import PlainDto from '../dtos/plain.dto';
import CustomResponse from '../dtos/custom-response';
import { TYPES } from '../config/ioc.types';
import IUnitOfService from '../services/interfaces/iunitof.service';
import { container } from '../config/ioc.config';
import { Role } from '@prisma/client';


/**
 * RBAC middleware — must be placed AFTER authenticateToken so that req.user is populated.
 * Usage: router.get('/admin', authenticateToken, authorization([Role.ADMIN]), handler)
 */
const authorization = (roles: Array<Role>) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.userId;

    if (!userId) {
      const response: CustomResponse<PlainDto> = {
        success: false,
        message: 'Unauthorized',
      };
      return res.status(401).json(response);
    }

    const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
    const user = await unitOfService.User.getUserById(userId);

    if (!user) {
      const response: CustomResponse<PlainDto> = {
        success: false,
        message: 'User not found',
      };
      return res.status(404).json(response);
    }

    // Ensure the user's role is contained in the authorized roles.
    const hasMatchingRole = roles.includes(user.role as Role);
    if (hasMatchingRole) {
      next();
    } else {
      const response: CustomResponse<PlainDto> = {
        success: false,
        message: 'Not enough permissions',
      };
      res.status(403).json(response);
      return;
    }
  };
};

export default authorization;
