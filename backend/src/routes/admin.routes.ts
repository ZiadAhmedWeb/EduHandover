import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { requireRole } from "../middleware/rbac.js";
import { validate } from "../middleware/validate.js";
import { inviteTeacherSchema } from "../schemas/auth.schema.js";
import * as authController from "../controllers/auth.controller.js";

const router = Router();

router.post(
  "/teachers/invite",
  authenticate,
  requireRole("ADMIN"),
  validate(inviteTeacherSchema),
  authController.inviteTeacher
);

export default router;
