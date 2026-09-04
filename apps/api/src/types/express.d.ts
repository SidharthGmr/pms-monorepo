import "express";

declare global {
  namespace Express {
    interface Request {
      /** Correlation id stamped by requestContext.middleware and echoed as x-request-id. */
      requestId?: string;
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
