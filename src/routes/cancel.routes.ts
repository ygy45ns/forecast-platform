import { Router } from "express";
import { cancelBet } from "../controllers/cancel.controller";

const router = Router();
router.post("/:id/cancel", cancelBet);
export default router;
