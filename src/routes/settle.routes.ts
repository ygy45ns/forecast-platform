import { Router } from "express";
import { settleBet } from "../controllers/settle.controller";

const router = Router();
router.post("/:id/settle", settleBet);
export default router;
