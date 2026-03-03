import { Router } from "express";
import { placeBet } from "../controllers/bet.controller";

const router = Router();

router.post("/", placeBet);

export default router;
