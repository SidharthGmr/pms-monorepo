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
        /** UserSession the bearer token was issued against (`sid` claim). */
        sessionId?: string;
      };
    }
  }
}

export { };
