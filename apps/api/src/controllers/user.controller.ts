import { Role, Status } from '@prisma/client';
import { Request, Response } from 'express';
import { container } from '../config/ioc.config';
import { TYPES } from '../config/ioc.types';
import CustomResponse from '../dtos/custom-response';
import { ListResponseDto } from '../dtos/list-response.dto';
import { UpdateUserDto, UserDto } from '../dtos/user.dto';
import CustomError from '../exceptions/custom-error';
import IUnitOfService from '../services/interfaces/iunitof.service';
import { UserFilterParams } from '../params/user.params';

export class UserController {
  constructor(private unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService)) {
    this.unitOfService = unitOfService;
  }


  getAllUsers = async (req: Request, res: Response): Promise<Response<CustomResponse<ListResponseDto<UserDto>>>> => {
    const filters: UserFilterParams = Object.fromEntries(
      Object.entries({
        page: req.query['page'] ? parseInt(req.query['page'] as string) : undefined,
        recordPerPage: req.query['recordPerPage'] ? parseInt(req.query['recordPerPage'] as string) : undefined,
        search: req.query['search'] as string | undefined,
        status: req.query['status'] ? req.query['status'] as Status : undefined,
        showAllRecords: req.query['showAllRecords'] !== undefined ? req.query['showAllRecords'] === 'true' : undefined,
        storeCode: req.user?.storeCode || undefined,
        email: req.query.email as string | undefined,
        userId: req.query.userId as string | undefined,
        phone: req.query.phone as string | undefined,
        role: req.query.role ? (req.query.role as Role) : undefined,

      }).filter(([, value]) => value !== undefined && value !== "")
    ) as UserFilterParams;

    /**
     * Role-based filtering
     */
    if (req.user?.role === Role.SUPER_ADMIN) {
      const storeCode = req.user?.storeCode;
      //filters.storeCode = req.user?.storeCode || undefined;
    } else if (req.user?.role === Role.ADMIN) {
      const storeCode = req.user?.storeCode;

    } else {
      const storeCode = req.user?.storeCode;
      const userId = req.user?.userId;

    }

    const users = await this.unitOfService.User.getAll(filters);
    if (!users) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        data: null
      });
    }

    const totalRecord = users.length;
    const response: CustomResponse<ListResponseDto<UserDto>> = {
      success: true,
      message: "User fetched successfully",
      data: {
        totalRecord: totalRecord,
        data: users,
      },
    };

    return res.status(200).json(response);
  };

  getUserById = async (req: Request, res: Response): Promise<Response<CustomResponse<UserDto>>> => {
    // The id comes from the route, not from the token: reading `req.user.userId` here made
    // GET /users/:userId return the caller's own record whatever id was asked for.
    const userId = req.params['userId'] as string;
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'userId is required',
        data: null
      });
    }

    // Honouring the param opens the endpoint to any id, so who may read what is enforced here
    // rather than on the route - every caller reads its own profile through this same handler.
    const isSelf = userId === req.user?.userId;
    const isAdmin = req.user?.role === Role.SUPER_ADMIN || req.user?.role === Role.ADMIN;
    if (!isSelf && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You are not allowed to view this user',
        data: null
      });
    }

    const user = await this.unitOfService.User.getUserById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        data: null
      });
    }

    return res.status(200).json({
      success: true,
      message: 'User fetched successfully',
      data: user,
    });

  }



  getUserByEmail = async (req: Request, res: Response): Promise<Response<CustomResponse<UserDto>>> => {
    const email = req.user?.email;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'email is required',
        data: null
      });
    }

    const user = await this.unitOfService.User.getByEmail(email, false);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        data: null
      });
    }

    return res.status(200).json({
      success: true,
      message: 'User fetched successfully',
      data: user,
    });
  };

  updateUserById = async (req: Request, res: Response): Promise<Response<CustomResponse<UserDto>>> => {

    const userId = req.params.userId as string;
    if (!userId) {
      const response: CustomResponse<UserDto> = {
        success: false,
        message: 'userId is required',
      };
      return res.status(400).json(response);
    }
    const updatedData = req.body as UpdateUserDto;
    const user = await this.unitOfService.User.update(userId, updatedData);

    if (!user) {
      throw new CustomError('User not found', 404);
    }

    const response: CustomResponse<UserDto> = {
      success: true,
      data: user,
    };

    return res.status(200).json(response);
  };

  updateStatusById = async (req: Request, res: Response): Promise<Response<CustomResponse<UserDto>>> => {

    const userId = req.params.userId as string;
    if (!userId) {
      const response: CustomResponse<UserDto> = {
        success: false,
        message: 'userId is required',
      };
      return res.status(400).json(response);
    }
    const updatedData = req.body as UpdateUserDto;
    const user = await this.unitOfService.User.updateStatus(userId, updatedData);

    if (!user) {
      throw new CustomError('User not found', 404);
    }

    const response: CustomResponse<UserDto> = {
      success: true,
      data: user,
    };

    return res.status(200).json(response);
  };

  updateActiveStatusById = async (req: Request, res: Response): Promise<Response<CustomResponse<UserDto>>> => {
    const userId = req.params.userId as string;
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'userId is required',
        data: null,
      });
    }

    const { isActive } = req.body as { isActive: boolean };

    // This route is open to ADMIN as well as SUPER_ADMIN, so it needs the guards
    // that a super-admin-only route did not: an admin must not be able to lock out
    // a super admin, and nobody may deactivate their own account.
    const target = await this.unitOfService.User.getUserById(userId);
    if (!target) {
      throw new CustomError('User not found', 404);
    }

    if (req.user?.userId === userId && !isActive) {
      throw new CustomError('You cannot deactivate your own account', 403);
    }

    if (req.user?.role !== Role.SUPER_ADMIN && target.role === Role.SUPER_ADMIN) {
      throw new CustomError('Only a super admin can change a super admin\'s status', 403);
    }

    const user = await this.unitOfService.User.updateActiveStatus(userId, isActive);

    if (!user) {
      throw new CustomError('User not found', 404);
    }

    const response: CustomResponse<UserDto> = {
      success: true,
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: user,
    };

    return res.status(200).json(response);
  };

  deleteUserById = async (req: Request, res: Response): Promise<Response<CustomResponse<UserDto>>> => {
    const userId = req.params.userId as string;
    if (!userId) {
      const response: CustomResponse<UserDto> = {
        success: false,
        message: 'userId is required',
      };
      return res.status(400).json(response);
    }
    const user = await this.unitOfService.User.delete(userId);
    if (!user) {
      throw new CustomError('User not found', 404);
    }

    const response: CustomResponse<UserDto> = {
      success: true,
      message: 'User deleted successfully',
      data: user,
    };

    return res.status(200).json(response);
  };

  updateProfile = async (req: Request, res: Response): Promise<Response<CustomResponse<UserDto>>> => {
    const userId = req.user?.userId;
    if (!userId) {
      const response: CustomResponse<UserDto> = {
        success: false,
        message: 'userId is required',
      };
      return res.status(400).json(response);
    }
    const updatedData = req.body as UpdateUserDto;
    const user = await this.unitOfService.User.update(userId, updatedData);

    if (!user) {
      throw new CustomError('User not found', 404);
    }

    const response: CustomResponse<UserDto> = {
      success: true,
      message: 'Profile updated successfully',
      data: user,
    };

    return res.status(200).json(response);
  };

  assignStore = async (req: Request, res: Response): Promise<Response<CustomResponse<UserDto>>> => {
    const userId = req.user?.userId;
    const storeId = Number(req.body.storeId);

    if (!userId) {
      throw new CustomError('userId is required', 400);
    }

    if (storeId === undefined || storeId === null) {
      throw new CustomError('storeId is required', 400);
    }


    // Verify store exists
    const store = await this.unitOfService.Store.getById(storeId);
    if (!store) {
      throw new CustomError('Store not found', 404);
    }

    // Update user with storeId
    const user = await this.unitOfService.User.update(userId, { storeId });

    if (!user) {
      throw new CustomError('Failed to assign store', 500);
    }

    const response: CustomResponse<UserDto> = {
      success: true,
      message: 'Store assigned successfully',
      data: user,
    };

    return res.status(200).json(response);
  };

  updateRole = async (req: Request, res: Response): Promise<Response<CustomResponse<UserDto>>> => {
    const paramUserId = req.params.userId;
    const userId = Array.isArray(paramUserId) ? paramUserId[0] : paramUserId;
    const { role } = req.body as { role: Role };

    if (!userId) {
      const response: CustomResponse<UserDto> = {
        success: false,
        message: 'userId is required',
      };
      return res.status(400).json(response);
    }

    const user = await this.unitOfService.User.updateRole(userId, role);
    if (!user) {
      throw new CustomError('User not found', 404);
    }

    const response: CustomResponse<UserDto> = {
      success: true,
      message: 'User role updated successfully',
      data: user,
    };

    return res.status(200).json(response);
  };

  superAdminUpdateRole = async (req: Request, res: Response): Promise<Response<CustomResponse<UserDto>>> => {
    const { email, userId, phone, role, status } = req.body as { email?: string; userId?: string; phone?: string; role?: Role; status?: Status };

    const identifier: { email?: string; userId?: string; phone?: string } = {};
    if (email) identifier.email = email;
    if (userId) identifier.userId = userId;
    if (phone) identifier.phone = phone;

    const updateData: { role?: Role; status?: Status } = {};
    if (role) updateData.role = role;
    if (status) updateData.status = status;

    const user = await this.unitOfService.User.updateUserByIdentifier(identifier, updateData);
    if (!user) {
      throw new CustomError('User not found', 404);
    }

    const response: CustomResponse<UserDto> = {
      success: true,
      message: 'User updated successfully',
      data: user,
    };

    return res.status(200).json(response);
  };


}
