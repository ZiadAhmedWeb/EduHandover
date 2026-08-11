import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import * as rosterController from "../controllers/roster.controller.js";

const router = Router();

router.get("/me", authenticate, rosterController.schoolMe);

export default router;
