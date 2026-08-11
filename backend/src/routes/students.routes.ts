import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { requireRole } from "../middleware/rbac.js";
import { validate } from "../middleware/validate.js";
import { createStudentSchema } from "../schemas/roster.schema.js";
import * as rosterController from "../controllers/roster.controller.js";

const router = Router();

router.get("/:studentId", authenticate, rosterController.getStudent);
router.post("/", authenticate, requireRole("ADMIN"), validate(createStudentSchema), rosterController.createStudent);

export default router;
