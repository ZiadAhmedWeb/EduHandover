import type { NextFunction, Request, Response } from "express";
import type { ZodSchema } from "zod";

export function validate<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        error: { code: "VALIDATION_ERROR", message: "Invalid request payload", details: result.error.issues },
      });
    }
    req.body = result.data;
    next();
  };
}
