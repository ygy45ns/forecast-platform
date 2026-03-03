import { Router } from "express";
import { reconcile } from "../controllers/admin.controller";

const router = Router();
router.get("/reconcile", reconcile);
export default router;
