import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import * as rosterController from "../controllers/roster.controller.js";

const router = Router();

router.get("/teachers", authenticate, rosterController.listTeachers);
router.get("/students", authenticate, rosterController.dashboardStudents);

export default router;
