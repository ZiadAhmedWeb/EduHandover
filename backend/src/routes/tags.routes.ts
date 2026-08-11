import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import * as handoverController from "../controllers/handover.controller.js";

const router = Router();

router.get("/", authenticate, handoverController.listTags);

export default router;
