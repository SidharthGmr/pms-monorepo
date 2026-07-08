import "express";

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
        name?: string;
        role?: string;
        storeCode?: string | null;
      };
    }
  }
}

export { };
