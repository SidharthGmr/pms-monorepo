import { Request } from "express";

export const getAuthenticatedUserId = (req: Request): string => {
  const usersId = req.user?.userId;

  if (!usersId) {
    throw new Error("USER_NOT_AUTHENTICATED");
  }
  return usersId;
};
