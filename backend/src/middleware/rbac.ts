import type { NextFunction, Request, Response } from "express";
import { ApiError } from "./error.js";
import type { AuthUser } from "./auth.js";

export function requireRole(...roles: AuthUser["role"][]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Not authenticated" } });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: { code: "FORBIDDEN", message: "You do not have permission to perform this action" } });
    }
    next();
  };
}

export function requireSchoolId(user: AuthUser): string {
  if (!user.schoolId) {
    throw new ApiError(403, "FORBIDDEN", "This action requires a school account");
  }
  return user.schoolId;
}
