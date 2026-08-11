import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { requireRole } from "../middleware/rbac.js";
import { validate } from "../middleware/validate.js";
import { createClassSchema, createStudentSchema } from "../schemas/roster.schema.js";
import * as rosterController from "../controllers/roster.controller.js";

const router = Router();

router.get("/", authenticate, rosterController.listClasses);
router.get("/:classId/students", authenticate, rosterController.listClassStudents);
router.post("/", authenticate, requireRole("ADMIN"), validate(createClassSchema), rosterController.createClass);

export default router;
