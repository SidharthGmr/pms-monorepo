import bcrypt from 'bcryptjs';
import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config';
import { container } from '../config/ioc.config';
import { TYPES } from '../config/ioc.types';
import CustomResponse from '../dtos/custom-response';
import { refreshTokenResponseDto } from '../dtos/loginResponse.dto';
import { UserDto } from '../dtos/user.dto';
import { Role } from '../enum/user.enum';
import CustomError from '../exceptions/custom-error';
import { ResetPasswordModel } from '../models/forgot-password.model';
import { LoginModel } from '../models/login.model';
import { CreateUserModel } from '../models/user.model';
import IUnitOfService from '../services/interfaces/iunitof.service';
import { isExpired } from '../utils/timeExpiry.util';
import { generateStoreCode, nowISO } from '../utils/authHelpers.service';
import { dispatchEmailAsync } from '../utils/email/emailDispatcher.util';

export class AccountController {
  constructor(private unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService)) {
    this.unitOfService = unitOfService;
  }

  login = async (req: Request, res: Response): Promise<Response<CustomResponse<UserDto>>> => {
    const model = req.body as LoginModel;

    if (!model.email || !model.password) {
      throw new CustomError('Email and password are required', 400);
    }
    const loggedInUser = await this.unitOfService.User.getByEmail(model.email);

    if (!loggedInUser) {
      throw new CustomError('Invalid email or password', 401);
    }

    const isPasswordValid = await bcrypt.compare(model.password, loggedInUser.password || '');

    if (!isPasswordValid) {
      throw new CustomError('Invalid email or password', 401);
    }

    if (!loggedInUser.isEmailVerified) {
      return res.status(403).json({
        success: false,
        message: 'Please verify your email before login',
        data: null,
      });
    }

    const tokenPayload = {
      id: loggedInUser.id,
      userId: loggedInUser.userId,
      name: loggedInUser.name,
      email: loggedInUser.email,
      role: loggedInUser.role,
      storeCode: loggedInUser.storeCode || null,
    };

    const token = jwt.sign(tokenPayload, config.jwt.secret, {
      expiresIn: config.jwt.accessExpires as any, // was hardcoded "10h"
      algorithm: 'HS256',
      audience: config.jwt.audience,
      issuer: config.jwt.issuer,
    });

    const user = await this.unitOfService.Account.login(model, token);

    if (!user) {
      throw new CustomError('Login processing failed', 500);
    }

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: { token, user },
    });
  };

  signup = async (req: Request, res: Response): Promise<Response<CustomResponse<UserDto>>> => {
    const data = req.body as CreateUserModel;
    let response: CustomResponse<UserDto>;

    const user = await this.unitOfService.User.getByEmail(data.email);

    if (user) {
      throw new CustomError('User already exists', 409);
    }

    const newUser = await this.unitOfService.Account.signup(data, Role.ADMIN);

    if (!newUser) {
      throw new CustomError('User creation failed', 400);
    }

    const tokenPayload = {
      id: newUser.id,
      userId: newUser.userId,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      storeCode: newUser.storeCode || null,
    };

    const token = jwt.sign(tokenPayload, config.jwt.secret, {
      expiresIn: config.jwt.emailVerifyExpires as any, // long-lived: this is an email verification link, not an access token
      algorithm: 'HS256',
      audience: config.jwt.audience,
      issuer: config.jwt.issuer,
    });


    const signupTokenUpdted = await this.unitOfService.Account.updateToken(newUser.userId, token);
    const otpUser = await this.unitOfService.User.getUserOtp(newUser.userId);

    if (!signupTokenUpdted || !otpUser) {
      throw new CustomError('Failed to fetch details', 400);
    }

    dispatchEmailAsync({
      userId: signupTokenUpdted.userId,
      to: signupTokenUpdted.email,
      subject: `Welcome to ${process.env.NEXT_PUBLIC_APP_NAME} 🎉`,
      templateName: 'welcome',
      html: `${process.env.JWT_ISSUER}/verify-email?token=${token}`
    });

    // dispatchEmailAsync({
    //   to: otpUser.email,
    //   subject: `Your ${process.env.NEXT_PUBLIC_APP_NAME} verification code`,
    //   templateName: 'otp',
    //   templateData: {
    //     FirstName: otpUser.name || otpUser.userName || 'there',
    //     PlatformName: process.env.NEXT_PUBLIC_APP_NAME,
    //     OTP_CODE: otpUser.emailVerificationToken,
    //     OtpExpiryMinutes: otpUser.emailVerificationExpires,
    //     LoginLink: `${process.env.NEXT_PUBLIC_MAIN_DOMAIN_URL}/login`,
    //     Year: String(new Date().getFullYear()),
    //   },
    // });


    response = {
      success: true,
      message: 'User created successfully',
      data: newUser,
    };
    return res.status(201).json(response);
  };

  createUser = async (req: Request, res: Response): Promise<Response<CustomResponse<UserDto>>> => {
    const data = req.body as CreateUserModel & { role?: Role };
    const storeCode = req.user?.storeCode || generateStoreCode(data.firstName || 'Store');

    const user = await this.unitOfService.User.getByEmail(data.email);
    if (user) {
      throw new CustomError('User already exists', 409);
    }

    const newUser = await this.unitOfService.Account.create(data, storeCode);

    if (!newUser) {
      throw new CustomError('User creation failed', 400);
    }

    const response: CustomResponse<UserDto> = {
      success: true,
      message: 'User created successfully by admin',
      data: newUser,
    };
    return res.status(201).json(response);
  };

  logout = async (req: Request, res: Response): Promise<Response<CustomResponse<null>>> => {
    const userId = req.user?.userId;

    if (!userId) {
      throw new CustomError('User ID is required', 400);
    }

    const clearToken = await this.unitOfService.Account.logout(userId);

    if (!clearToken) {
      throw new CustomError('Clear Token failed', 400);
    }

    const user = await this.unitOfService.User.getUserById(userId);
    if (!user) {
      throw new CustomError('User not found', 404);
    }

    const response: CustomResponse<null> = {
      success: true,
      message: 'Logout successful',
      data: null,
    };

    return res.status(200).json(response);
  };

  refreshToken = async (req: Request, res: Response): Promise<Response<CustomResponse<refreshTokenResponseDto>>> => {
    const { token: oldToken } = req.body as { token: string };

    if (!oldToken) {
      throw new CustomError('Token is required', 400);
    }

    let decoded: jwt.JwtPayload;

    try {
      decoded = jwt.verify(oldToken, config.jwt.secret, {
        algorithms: ['HS256'],
        audience: config.jwt.audience || undefined,
        issuer: config.jwt.issuer || undefined,
      }) as jwt.JwtPayload;
    } catch {
      throw new CustomError('Invalid or expired refresh token', 401);
    }


    const userId = (decoded.userId);

    if (!userId) {
      throw new CustomError('Invalid refresh token', 400);
    }

    const user = await this.unitOfService.User.getUserById(userId);

    if (!user) {
      throw new CustomError('User not found', 404);
    }

    if (!user.refreshToken || user.refreshToken !== oldToken) {
      throw new CustomError('Invalid refresh token', 401);
    }

    const tokenPayload = {
      id: decoded.id,
      userId: decoded.userId,
      name: decoded.name,
      email: decoded.email,
      role: decoded.role,
      profileImageUrl: decoded.profileImageUrl,
      storeCode: decoded.storeCode || null,
      tokenUpdated: 'Yes',
    };

    const token = jwt.sign(tokenPayload, config.jwt.secret, {
      expiresIn: config.jwt.accessExpires as any,
      algorithm: 'HS256',
      audience: config.jwt.audience,
      issuer: config.jwt.issuer,
      notBefore: '0', // Cannot use before now, can be configured to be deferred.
    });

    await this.unitOfService.Account.updateToken(userId, token);

    const updateUser = await this.unitOfService.User.getUserById(userId);

    if (!updateUser || !updateUser.token || !updateUser.refreshToken) {
      throw new CustomError('Token not found', 400);
    }
    const newToken = updateUser.token;
    const refreshToken = updateUser.refreshToken;

    const response: CustomResponse<refreshTokenResponseDto> = {
      success: true,
      message: 'Token refreshed successfully',
      data: { newToken, refreshToken },
    };
    return res.status(200).json(response);
  };

  sendVerificationOtp = async (req: Request, res: Response) => {
    const { email } = req.body as { email: string };

    const userByEmail = await this.unitOfService.User.getByEmail(email);
    if (!userByEmail) {
      throw new CustomError('User not found', 404);
    }

    const user = await this.unitOfService.Account.sendVerificationOtp(userByEmail.userId);

    dispatchEmailAsync({
      to: user.email,
      subject: `Your ${process.env.NEXT_PUBLIC_APP_NAME} verification code`,
      templateName: 'otp',
      templateData: {
        FirstName: user.name || user.userName || 'there',
        PlatformName: process.env.NEXT_PUBLIC_APP_NAME,
        OTP_CODE: user.emailVerificationToken,
        OtpExpiryMinutes: user.emailVerificationExpires,
        LoginLink: `${process.env.NEXT_PUBLIC_MAIN_DOMAIN_URL}/login`,
        Year: String(new Date().getFullYear()),
      },
    });


    const response: CustomResponse<UserDto> = {
      success: true,
      message: 'OTP sent successfully',
      data: user,
    };
    return res.status(200).json(response);
  };

  otpVerify = async (req: Request, res: Response): Promise<Response<CustomResponse<UserDto>>> => {
    const { otp, email } = req.body as { otp: string; email?: string };
    const userId = req.body.userId || req.params.userId;

    if (!otp) {
      throw new CustomError('OTP is required', 400);
    }

    let user: UserDto | null = null;
    if (userId) {
      user = await this.unitOfService.User.getUserById(userId);
    } else if (email) {
      user = await this.unitOfService.User.getByEmail(email);
    }

    if (!user) {
      throw new CustomError('User not found', 404);
    }

    if (user.isEmailVerified) {
      return res.status(200).json({
        success: false,
        message: 'User already verified',
        data: user,
      });
    }

    if (!user.emailVerificationToken || !user.emailVerificationExpires) {
      return res.status(400).json({
        success: false,
        message: 'OTP not generated or already used. Please resend OTP',
        data: null,
      });
    }

    if (isExpired(user.emailVerificationExpires, 1)) {
      return res.status(400).json({
        success: false,
        message: 'OTP expired. Please resend OTP',
        data: null,
      });
    }

    if (user.emailVerificationToken !== otp) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP',
        data: null,
      });
    }

    const updatedUser = await this.unitOfService.Account.updateEmailStatus(user.email);

    if (!updatedUser) {
      throw new CustomError('Failed to verify email', 500);
    }

    return res.status(200).json({
      success: true,
      message: 'OTP verified successfully',
      data: updatedUser,
    });
  };

  verifyToken = async (req: Request, res: Response): Promise<Response<CustomResponse<UserDto>>> => {
    const { token } = req.body as { token: string };

    // Validate the token: it must be a valid JWT. The userId is read from its payload.
    let decoded: jwt.JwtPayload;
    try {
      decoded = jwt.verify(token, config.jwt.secret, {
        algorithms: ['HS256'],
        audience: config.jwt.audience || undefined,
        issuer: config.jwt.issuer || undefined,
      }) as jwt.JwtPayload;
    } catch {
      throw new CustomError('Invalid or expired verification token', 401);
    }

    const userId = decoded.userId as string | undefined;
    if (!userId) {
      throw new CustomError('Invalid verification token', 401);
    }
    console.log("userId", userId)

    const user = await this.unitOfService.User.getUserById(userId);
    if (!user) {
      throw new CustomError('User not found', 404);
    }

    if (user.isEmailVerified) {
      return res.status(200).json({
        success: true,
        message: 'Email already verified',
        data: user,
      });
    }

    // Ensure the token matches the one issued to this user at signup.
    if (user.token !== token) {
      throw new CustomError('Invalid verification token', 401);
    }

    const updatedUser = await this.unitOfService.Account.updateEmailStatus(user.email);
    if (!updatedUser) {
      throw new CustomError('Failed to verify email', 500);
    }

    return res.status(200).json({
      success: true,
      message: 'Email verified successfully',
      data: updatedUser,
    });

  };

  forgotPassword = async (req: Request, res: Response): Promise<Response<CustomResponse<null>>> => {
    const { email } = req.body;

    if (!email) {
      throw new CustomError('Email is required', 400);
    }

    const existingUser = await this.unitOfService.User.getByEmail(email);

    if (existingUser) {
      await this.unitOfService.Account.forgotPassword(existingUser.userId);
    }

    return res.status(200).json({
      success: true,
      message: 'If the email exists, an OTP has been sent.',
      data: null,
    });
  };

  resetPassword = async (req: Request, res: Response): Promise<Response<CustomResponse<UserDto | null>>> => {
    const data = req.body as ResetPasswordModel;

    if (!data.email) {
      throw new CustomError('Email is required', 400);
    }

    if (!data.otp) {
      throw new CustomError('OTP is required', 400);
    }

    if (!data.newPassword || !data.confirmPassword) {
      throw new CustomError('New password and confirm password are required', 400);
    }

    if (data.newPassword !== data.confirmPassword) {
      throw new CustomError('Password and confirm password do not match', 400);
    }

    const user = await this.unitOfService.User.getByEmail(data.email);

    if (!user) {
      return res.status(200).json({
        success: true,
        message: 'If the email and OTP are valid, your password has been reset.',
        data: null,
      });
    }

    if (!user.emailVerificationToken || !user.emailVerificationExpires) {
      throw new CustomError('OTP not generated or already used. Please resend OTP', 400);
    }

    if (isExpired(user.emailVerificationExpires, 1)) {
      throw new CustomError('OTP expired. Please resend OTP', 400);
    }

    if (user.emailVerificationToken !== data.otp) {
      throw new CustomError('Invalid OTP', 400);
    }

    const updatedUser = await this.unitOfService.Account.resetPassword(user.userId, data);

    if (!updatedUser) {
      throw new CustomError('Password reset failed', 500);
    }

    const response: CustomResponse<UserDto> = {
      success: true,
      message: 'Password reset successfully',
      data: updatedUser,
    };
    return res.status(200).json(response);
  };

}
