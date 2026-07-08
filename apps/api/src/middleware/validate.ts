import { Request, Response, NextFunction } from "express";
import { ZodObject, ZodError } from "zod";

export const validate =
  (schema: ZodObject<any>) =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      // Check if body/query/params match the schema
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next(); // All good, proceed
    } catch (error) {
      if (error instanceof ZodError) {
        console.log("Validation error details:", error.issues);
        // Return a nice error message
        return res.status(400).json({
          error: "Validation Failed",
          details: error.issues.map((e) => ({
            field: e.path[1], // e.g., "emailId"
            message: e.message, // e.g., "Invalid email"
          })),
        });
      }
      return res.status(500).json({ error: "Internal Server Error" });
    }
  };
